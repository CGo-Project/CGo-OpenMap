/**
 * CGo OpenMap - 大连官方首末班车数据
 *
 * 来源：大连公共交通建设投资集团官网「站点查询」详情页的公开接口
 * （https://www.dltransgrp.com/hb-air-api/site/ShowSite.do，参数 siteId 见 DALIAN_STATION_DETAIL_SITE_ID）。
 * 每座车站按停靠线路逐条比对其上下行首末班，比对一致或修正后落库；采集时间见 DALIAN_TIMETABLE_SOURCE。
 *
 * 日期分组说明：官网详情页每站只给一组时刻（经比对为工作日值），故
 * · 原先工作日与休息日一致的站（绝大多数），两组同值应用；
 * · 原先两组不同的站（双D港、金石滩、小窑湾），保留其「休息日首班比工作日晚 15 分钟」的既有差值，
 *   以新工作日值按同一差值推算休息日值。
 *
 * 3 号线支线各站（含开发区）「开往普兰店振兴街」的时刻，官网站点详情页在「大交路」侧直接给出，
 * 已按官网值记录，不再由 3 号线支线站间差值反推，故全表不含任何推算（isEstimated）记录。
 *
 * destinationStationId 与沈阳统一语义：线路端点写 "line-first" / "line-last" 代号，
 * 非端点的贯通区间车（如 13 号线开往开发区 0308）保留站 ID。
 * 展示侧统一由共享层 CGoTimetable.resolveDestination 解析。
 */

const DALIAN_TIMETABLE_DATA = {
    "1321": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "十三里",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:51",
                            "last": "20:16"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:50",
                            "last": "20:10"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:51",
                            "last": "20:16"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:50",
                            "last": "20:10"
                        }
                    ]
                }
            ]
        }
    },
    "1322": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "二十里堡",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:54",
                            "last": "20:19"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:47",
                            "last": "20:07"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:54",
                            "last": "20:19"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:47",
                            "last": "20:07"
                        }
                    ]
                }
            ]
        }
    },
    "1324": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "三十里堡",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:01",
                            "last": "20:26"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:40",
                            "last": "20:00"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:01",
                            "last": "20:26"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:40",
                            "last": "20:00"
                        }
                    ]
                }
            ]
        }
    },
    "1327": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "石河黄旗",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:08",
                            "last": "20:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:33",
                            "last": "19:53"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:08",
                            "last": "20:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:33",
                            "last": "19:53"
                        }
                    ]
                }
            ]
        }
    },
    "1328": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "普湾体育场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:12",
                            "last": "20:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:29",
                            "last": "19:49"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:12",
                            "last": "20:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:29",
                            "last": "19:49"
                        }
                    ]
                }
            ]
        }
    },
    "1329": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "石河北海",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:15",
                            "last": "20:40"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:26",
                            "last": "19:46"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:15",
                            "last": "20:40"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:26",
                            "last": "19:46"
                        }
                    ]
                }
            ]
        }
    },
    "1331": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "长店堡",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:19",
                            "last": "20:44"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:22",
                            "last": "19:42"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:19",
                            "last": "20:44"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:22",
                            "last": "19:42"
                        }
                    ]
                }
            ]
        }
    },
    "1332": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "大医三院",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:22",
                            "last": "20:47"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:19",
                            "last": "19:39"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:22",
                            "last": "20:47"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:19",
                            "last": "19:39"
                        }
                    ]
                }
            ]
        }
    },
    "1333": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "海湾高中",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:25",
                            "last": "20:50"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:16",
                            "last": "19:36"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:25",
                            "last": "20:50"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:16",
                            "last": "19:36"
                        }
                    ]
                }
            ]
        }
    },
    "1334": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "普兰店开发区",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:27",
                            "last": "20:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:14",
                            "last": "19:34"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "07:27",
                            "last": "20:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:14",
                            "last": "19:34"
                        }
                    ]
                }
            ]
        }
    },
    "1336": {
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "普兰店振兴街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:10",
                            "last": "19:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:10",
                            "last": "19:30"
                        }
                    ]
                }
            ]
        }
    },
    "0320": {
        "DLM99": {
            "lineNo": "99",
            "lineName": "3号线支线",
            "stationName": "九里",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "05:55",
                            "last": "20:15"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "05:55",
                            "last": "20:15"
                        }
                    ]
                }
            ]
        },
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "九里",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:46",
                            "last": "20:11"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:55",
                            "last": "20:15"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:46",
                            "last": "20:11"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "0308",
                            "destinationName": "开发区",
                            "first": "06:55",
                            "last": "20:15"
                        }
                    ]
                }
            ]
        }
    },
    "0319": {
        "DLM99": {
            "lineNo": "99",
            "lineName": "3号线支线",
            "stationName": "十九局",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "05:58",
                            "last": "20:18"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:17",
                            "last": "20:37"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "05:58",
                            "last": "20:18"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:17",
                            "last": "20:37"
                        }
                    ]
                }
            ]
        },
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "十九局",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:42",
                            "last": "20:07"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:42",
                            "last": "20:07"
                        }
                    ]
                }
            ]
        }
    },
    "0318": {
        "DLM99": {
            "lineNo": "99",
            "lineName": "3号线支线",
            "stationName": "和平路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:03",
                            "last": "20:23"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:13",
                            "last": "20:33"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:03",
                            "last": "20:23"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:13",
                            "last": "20:33"
                        }
                    ]
                }
            ]
        },
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "和平路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:38",
                            "last": "20:03"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:38",
                            "last": "20:03"
                        }
                    ]
                }
            ]
        }
    },
    "0317": {
        "DLM99": {
            "lineNo": "99",
            "lineName": "3号线支线",
            "stationName": "东山路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:06",
                            "last": "20:27"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:10",
                            "last": "20:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:06",
                            "last": "20:27"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:10",
                            "last": "20:30"
                        }
                    ]
                }
            ]
        },
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "东山路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:35",
                            "last": "20:00"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:35",
                            "last": "20:00"
                        }
                    ]
                }
            ]
        }
    },
    "0316": {
        "DLM99": {
            "lineNo": "99",
            "lineName": "3号线支线",
            "stationName": "鸿玮澜山",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:09",
                            "last": "20:29"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:07",
                            "last": "20:27"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:09",
                            "last": "20:29"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:07",
                            "last": "20:27"
                        }
                    ]
                }
            ]
        },
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "鸿玮澜山",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:32",
                            "last": "19:57"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:32",
                            "last": "19:57"
                        }
                    ]
                }
            ]
        }
    },
    "0315": {
        "DLM99": {
            "lineNo": "99",
            "lineName": "3号线支线",
            "stationName": "通世泰",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:13",
                            "last": "20:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:03",
                            "last": "20:23"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "开发区",
                            "first": "06:13",
                            "last": "20:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:03",
                            "last": "20:23"
                        }
                    ]
                }
            ]
        },
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "通世泰",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:28",
                            "last": "19:53"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:28",
                            "last": "19:53"
                        }
                    ]
                }
            ]
        }
    },
    "0308": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "开发区",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:03",
                            "last": "21:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:32",
                            "last": "20:02"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:32",
                            "last": "22:02"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:03",
                            "last": "21:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:32",
                            "last": "20:02"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:32",
                            "last": "22:02"
                        }
                    ]
                }
            ]
        },
        "DLM99": {
            "lineNo": "99",
            "lineName": "3号线支线",
            "stationName": "开发区",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:00",
                            "last": "20:20"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0308-0320",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "九里",
                            "first": "06:00",
                            "last": "20:20"
                        }
                    ]
                }
            ]
        },
        "DLM13": {
            "lineNo": "13",
            "lineName": "13号线",
            "stationName": "开发区",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:25",
                            "last": "19:50"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-13-1321-1336",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "普兰店振兴街",
                            "first": "06:25",
                            "last": "19:50"
                        }
                    ]
                }
            ]
        }
    },
    "0301": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "大连站",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:15",
                            "last": "22:45"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:53",
                            "last": "22:23"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:15",
                            "last": "22:45"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:53",
                            "last": "22:23"
                        }
                    ]
                }
            ]
        },
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "大连站",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:00",
                            "last": "19:30"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:00",
                            "last": "21:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:00",
                            "last": "19:30"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:00",
                            "last": "21:30"
                        }
                    ]
                }
            ]
        }
    },
    "0302": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "香炉礁",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "05:58",
                            "last": "22:03"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:04",
                            "last": "19:34"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:04",
                            "last": "21:34"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "05:58",
                            "last": "22:03"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:04",
                            "last": "19:34"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:04",
                            "last": "21:34"
                        }
                    ]
                }
            ]
        }
    },
    "0303": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "金家街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "05:59",
                            "last": "21:58"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:09",
                            "last": "19:39"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:09",
                            "last": "21:39"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "05:59",
                            "last": "21:58"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:09",
                            "last": "19:39"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:09",
                            "last": "21:39"
                        }
                    ]
                }
            ]
        }
    },
    "0304": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "泉水",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:14",
                            "last": "19:44"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:14",
                            "last": "21:44"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:14",
                            "last": "19:44"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:14",
                            "last": "21:44"
                        }
                    ]
                }
            ]
        }
    },
    "0305": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "后盐",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:35",
                            "last": "23:05"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:34",
                            "last": "22:04"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:35",
                            "last": "23:05"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:34",
                            "last": "22:04"
                        }
                    ]
                }
            ]
        },
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "后盐",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:48"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:18",
                            "last": "19:48"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:18",
                            "last": "21:48"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:48"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:18",
                            "last": "19:48"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:18",
                            "last": "21:48"
                        }
                    ]
                }
            ]
        }
    },
    "0306": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "大连湾",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:24",
                            "last": "19:54"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:24",
                            "last": "21:54"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:24",
                            "last": "19:54"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:24",
                            "last": "21:54"
                        }
                    ]
                }
            ]
        }
    },
    "0307": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "金马路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:06",
                            "last": "21:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:28",
                            "last": "19:58"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:28",
                            "last": "21:58"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:06",
                            "last": "21:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:28",
                            "last": "19:58"
                        },
                        {
                            "direction": "up",
                            "destinationStationId": "0309",
                            "destinationName": "保税区",
                            "first": "06:28",
                            "last": "21:58"
                        }
                    ]
                }
            ]
        }
    },
    "0309": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "保税区",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:30"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:35",
                            "last": "20:05"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:00",
                            "last": "21:30"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:35",
                            "last": "20:05"
                        }
                    ]
                }
            ]
        }
    },
    "0310": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "双D港",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:27",
                            "last": "20:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:41",
                            "last": "20:11"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:42",
                            "last": "20:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:41",
                            "last": "20:11"
                        }
                    ]
                }
            ]
        }
    },
    "0313": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "小窑湾",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:24",
                            "last": "20:39"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:45",
                            "last": "20:15"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:39",
                            "last": "20:39"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "金石滩",
                            "first": "06:45",
                            "last": "20:15"
                        }
                    ]
                }
            ]
        }
    },
    "0311": {
        "DLM03": {
            "lineNo": "03",
            "lineName": "3号线",
            "stationName": "金石滩",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:15",
                            "last": "20:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-03-0301-0311",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "大连站",
                            "first": "06:30",
                            "last": "20:30"
                        }
                    ]
                }
            ]
        }
    },
    "0201": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "海之韵",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                }
            ]
        }
    },
    "0202": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "东海",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:32",
                            "last": "22:32"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:15",
                            "last": "23:35"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:32",
                            "last": "22:32"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:15",
                            "last": "23:35"
                        }
                    ]
                }
            ]
        }
    },
    "0203": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "东港",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:34",
                            "last": "22:34"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:13",
                            "last": "23:33"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:34",
                            "last": "22:34"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:13",
                            "last": "23:33"
                        }
                    ]
                }
            ]
        }
    },
    "0204": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "会议中心",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:37",
                            "last": "22:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:11",
                            "last": "23:31"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:37",
                            "last": "22:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:11",
                            "last": "23:31"
                        }
                    ]
                }
            ]
        }
    },
    "0205": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "港湾广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:39",
                            "last": "22:39"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:08",
                            "last": "23:28"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:39",
                            "last": "22:39"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:08",
                            "last": "23:28"
                        }
                    ]
                }
            ]
        }
    },
    "0206": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "中山广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:42",
                            "last": "22:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:05",
                            "last": "23:26"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:42",
                            "last": "22:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:05",
                            "last": "23:26"
                        }
                    ]
                }
            ]
        }
    },
    "0207": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "友好广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:44",
                            "last": "22:44"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:03",
                            "last": "23:24"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:44",
                            "last": "22:44"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:03",
                            "last": "23:24"
                        }
                    ]
                }
            ]
        }
    },
    "0208": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "青泥洼桥",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:46",
                            "last": "22:46"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:01",
                            "last": "23:22"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:46",
                            "last": "22:46"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "06:01",
                            "last": "23:22"
                        }
                    ]
                }
            ]
        },
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "青泥洼桥",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:13",
                            "last": "22:43"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:55",
                            "last": "22:25"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:13",
                            "last": "22:43"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:55",
                            "last": "22:25"
                        }
                    ]
                }
            ]
        }
    },
    "0209": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "一二九街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:48",
                            "last": "22:48"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:59",
                            "last": "23:20"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:48",
                            "last": "22:48"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:59",
                            "last": "23:20"
                        }
                    ]
                }
            ]
        }
    },
    "0210": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "人民广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:50",
                            "last": "22:50"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:57",
                            "last": "23:18"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:50",
                            "last": "22:50"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:57",
                            "last": "23:18"
                        }
                    ]
                }
            ]
        }
    },
    "0211": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "联合路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:53",
                            "last": "22:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:54",
                            "last": "23:15"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:53",
                            "last": "22:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:54",
                            "last": "23:15"
                        }
                    ]
                }
            ]
        }
    },
    "0113": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "西安路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:55",
                            "last": "22:55"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:52",
                            "last": "23:12"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:55",
                            "last": "22:55"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:52",
                            "last": "23:12"
                        }
                    ]
                }
            ]
        },
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "西安路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:52",
                            "last": "22:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:59",
                            "last": "22:59"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:52",
                            "last": "22:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:59",
                            "last": "22:59"
                        }
                    ]
                }
            ]
        }
    },
    "0212": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "交通大学",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:59",
                            "last": "22:59"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:49",
                            "last": "23:09"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:59",
                            "last": "22:59"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:49",
                            "last": "23:09"
                        }
                    ]
                }
            ]
        }
    },
    "0213": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "辽师大",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:01",
                            "last": "23:01"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:47",
                            "last": "23:07"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:01",
                            "last": "23:01"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:47",
                            "last": "23:07"
                        }
                    ]
                }
            ]
        }
    },
    "0214": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "马栏广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:03",
                            "last": "23:03"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:45",
                            "last": "23:05"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:03",
                            "last": "23:03"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:45",
                            "last": "23:05"
                        }
                    ]
                }
            ]
        }
    },
    "0215": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "湾家",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:05",
                            "last": "23:05"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:43",
                            "last": "23:03"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:05",
                            "last": "23:05"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:43",
                            "last": "23:03"
                        }
                    ]
                }
            ]
        }
    },
    "0216": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "红旗西路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:07",
                            "last": "23:07"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:41",
                            "last": "23:01"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "06:07",
                            "last": "23:07"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:41",
                            "last": "23:01"
                        }
                    ]
                }
            ]
        }
    },
    "0217": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "虹锦路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:44",
                            "last": "23:10"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:38",
                            "last": "22:58"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:44",
                            "last": "23:10"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:38",
                            "last": "22:58"
                        }
                    ]
                }
            ]
        }
    },
    "0218": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "虹港路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:46",
                            "last": "23:12"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:36",
                            "last": "22:56"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:46",
                            "last": "23:12"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:36",
                            "last": "22:56"
                        }
                    ]
                }
            ]
        }
    },
    "0219": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "机场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:48",
                            "last": "23:14"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:34",
                            "last": "22:54"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:48",
                            "last": "23:14"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:34",
                            "last": "22:54"
                        }
                    ]
                }
            ]
        }
    },
    "0220": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "辛寨子",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:33",
                            "last": "23:18"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:30",
                            "last": "22:50"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:33",
                            "last": "23:18"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:30",
                            "last": "22:50"
                        }
                    ]
                }
            ]
        }
    },
    "0221": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "前革",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:35",
                            "last": "23:21"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:48",
                            "last": "22:48"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:35",
                            "last": "23:21"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:48",
                            "last": "22:48"
                        }
                    ]
                }
            ]
        }
    },
    "0222": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "中革",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:38",
                            "last": "23:23"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:45",
                            "last": "22:45"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:38",
                            "last": "23:23"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:45",
                            "last": "22:45"
                        }
                    ]
                }
            ]
        }
    },
    "0223": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "革镇堡",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:40",
                            "last": "23:26"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:42",
                            "last": "22:42"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:40",
                            "last": "23:26"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:42",
                            "last": "22:42"
                        }
                    ]
                }
            ]
        }
    },
    "0224": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "后革",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:43",
                            "last": "23:28"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:40",
                            "last": "22:40"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:43",
                            "last": "23:28"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:40",
                            "last": "22:40"
                        }
                    ]
                }
            ]
        }
    },
    "0225": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "卫生中心",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:45",
                            "last": "23:30"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:38",
                            "last": "22:38"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:45",
                            "last": "23:30"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:38",
                            "last": "22:38"
                        }
                    ]
                }
            ]
        }
    },
    "0226": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "体育中心",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:47",
                            "last": "23:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:35",
                            "last": "22:35"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:47",
                            "last": "23:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:35",
                            "last": "22:35"
                        }
                    ]
                }
            ]
        }
    },
    "0227": {
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "南关岭",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:50",
                            "last": "23:35"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:33",
                            "last": "22:33"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "大连北站",
                            "first": "05:50",
                            "last": "23:35"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:33",
                            "last": "22:33"
                        }
                    ]
                }
            ]
        }
    },
    "0102": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "大连北站",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:18",
                            "last": "23:18"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:33",
                            "last": "22:33"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:18",
                            "last": "23:18"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:33",
                            "last": "22:33"
                        }
                    ]
                }
            ]
        },
        "DLM02": {
            "lineNo": "02",
            "lineName": "2号线",
            "stationName": "大连北站",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-02-0201-0227",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "海之韵",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                }
            ]
        }
    },
    "0101": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "姚家",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                }
            ]
        }
    },
    "0103": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "华北路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:16",
                            "last": "23:16"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:35",
                            "last": "22:35"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:16",
                            "last": "23:16"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:35",
                            "last": "22:35"
                        }
                    ]
                }
            ]
        }
    },
    "0104": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "华南北",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:13",
                            "last": "23:13"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:38",
                            "last": "22:38"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:13",
                            "last": "23:13"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:38",
                            "last": "22:38"
                        }
                    ]
                }
            ]
        }
    },
    "0105": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "华南广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:11",
                            "last": "23:11"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:40",
                            "last": "22:40"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:11",
                            "last": "23:11"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:40",
                            "last": "22:40"
                        }
                    ]
                }
            ]
        }
    },
    "0106": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "千山路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:08",
                            "last": "23:08"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:42",
                            "last": "22:42"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:08",
                            "last": "23:08"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:42",
                            "last": "22:42"
                        }
                    ]
                }
            ]
        }
    },
    "0107": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "松江路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:06",
                            "last": "23:06"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:44",
                            "last": "22:44"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:06",
                            "last": "23:06"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:44",
                            "last": "22:44"
                        }
                    ]
                }
            ]
        }
    },
    "0108": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "东纬路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:04",
                            "last": "23:04"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:47",
                            "last": "22:47"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:04",
                            "last": "23:04"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:47",
                            "last": "22:47"
                        }
                    ]
                }
            ]
        }
    },
    "0109": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "春柳",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:00",
                            "last": "23:00"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:51",
                            "last": "22:51"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "06:00",
                            "last": "23:00"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:51",
                            "last": "22:51"
                        }
                    ]
                }
            ]
        }
    },
    "0110": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "香工街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:58",
                            "last": "22:58"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:53",
                            "last": "22:53"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:58",
                            "last": "22:58"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:53",
                            "last": "22:53"
                        }
                    ]
                }
            ]
        }
    },
    "0111": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "中长街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:56",
                            "last": "22:56"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:55",
                            "last": "22:55"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:56",
                            "last": "22:56"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:55",
                            "last": "22:55"
                        }
                    ]
                }
            ]
        }
    },
    "0112": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "兴工街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:54",
                            "last": "22:54"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:57",
                            "last": "22:57"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:54",
                            "last": "22:54"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "05:57",
                            "last": "22:57"
                        }
                    ]
                }
            ]
        }
    },
    "0114": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "富国街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:49",
                            "last": "22:49"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:02",
                            "last": "23:02"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:49",
                            "last": "22:49"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:02",
                            "last": "23:02"
                        }
                    ]
                }
            ]
        }
    },
    "0115": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "会展中心",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:47",
                            "last": "22:47"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:04",
                            "last": "23:04"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:47",
                            "last": "22:47"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:04",
                            "last": "23:04"
                        }
                    ]
                }
            ]
        }
    },
    "0116": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "星海广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:44",
                            "last": "22:44"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:06",
                            "last": "23:06"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:44",
                            "last": "22:44"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:06",
                            "last": "23:06"
                        }
                    ]
                }
            ]
        }
    },
    "0117": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "大医二院",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:42",
                            "last": "22:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:08",
                            "last": "23:07"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:42",
                            "last": "22:42"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:08",
                            "last": "23:07"
                        }
                    ]
                }
            ]
        }
    },
    "0118": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "黑石礁",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:40",
                            "last": "22:40"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:10",
                            "last": "23:10"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:40",
                            "last": "22:40"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:10",
                            "last": "23:10"
                        }
                    ]
                }
            ]
        }
    },
    "0119": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "学苑广场",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:37",
                            "last": "22:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:13",
                            "last": "23:13"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:37",
                            "last": "22:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:13",
                            "last": "23:13"
                        }
                    ]
                }
            ]
        }
    },
    "0120": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "海事大学",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:35",
                            "last": "22:35"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:15",
                            "last": "23:15"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:35",
                            "last": "22:35"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:15",
                            "last": "23:15"
                        }
                    ]
                }
            ]
        }
    },
    "0121": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "七贤岭",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:33",
                            "last": "22:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:17",
                            "last": "23:17"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:33",
                            "last": "22:33"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "河口",
                            "first": "06:17",
                            "last": "23:17"
                        }
                    ]
                }
            ]
        }
    },
    "0801": {
        "DLM01": {
            "lineNo": "01",
            "lineName": "1号线",
            "stationName": "河口",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-01-0101-0801",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "姚家",
                            "first": "05:30",
                            "last": "22:30"
                        }
                    ]
                }
            ]
        },
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "河口",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:05",
                            "last": "20:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:05",
                            "last": "20:30"
                        }
                    ]
                }
            ]
        }
    },
    "0802": {
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "蔡大岭",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:47",
                            "last": "21:32"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:09",
                            "last": "20:34"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:47",
                            "last": "21:32"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:09",
                            "last": "20:34"
                        }
                    ]
                }
            ]
        }
    },
    "0803": {
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "黄泥川",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:41",
                            "last": "21:26"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:14",
                            "last": "20:39"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:41",
                            "last": "21:26"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:14",
                            "last": "20:39"
                        }
                    ]
                }
            ]
        }
    },
    "0804": {
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "龙王塘",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:36",
                            "last": "21:21"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:20",
                            "last": "20:45"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:36",
                            "last": "21:21"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:20",
                            "last": "20:45"
                        }
                    ]
                }
            ]
        }
    },
    "0805": {
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "塔河湾",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:27",
                            "last": "21:12"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:28",
                            "last": "20:53"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:27",
                            "last": "21:12"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:28",
                            "last": "20:53"
                        }
                    ]
                }
            ]
        }
    },
    "0806": {
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "旅顺",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:18",
                            "last": "21:03"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:37",
                            "last": "21:02"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:18",
                            "last": "21:03"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:37",
                            "last": "21:02"
                        }
                    ]
                }
            ]
        }
    },
    "0807": {
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "铁山",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:09",
                            "last": "20:54"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:46",
                            "last": "21:11"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:09",
                            "last": "20:54"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-last",
                            "destinationName": "旅顺新港",
                            "first": "06:46",
                            "last": "21:11"
                        }
                    ]
                }
            ]
        }
    },
    "0808": {
        "DLM12": {
            "lineNo": "12",
            "lineName": "12号线",
            "stationName": "旅顺新港",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:05",
                            "last": "20:50"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-12-0801-0808",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-first",
                            "destinationName": "河口",
                            "first": "06:05",
                            "last": "20:50"
                        }
                    ]
                }
            ]
        }
    },
    "0501": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "虎滩新区",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:00",
                            "last": "22:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:00",
                            "last": "22:30"
                        }
                    ]
                }
            ]
        }
    },
    "0502": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "虎滩公园",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:02",
                            "last": "22:32"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:07",
                            "last": "22:37"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:02",
                            "last": "22:32"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:07",
                            "last": "22:37"
                        }
                    ]
                }
            ]
        }
    },
    "0503": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "秀月街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:04",
                            "last": "22:34"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:04",
                            "last": "22:34"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:04",
                            "last": "22:34"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:04",
                            "last": "22:34"
                        }
                    ]
                }
            ]
        }
    },
    "0504": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "桃源",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:05",
                            "last": "22:35"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:02",
                            "last": "22:32"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:05",
                            "last": "22:35"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:02",
                            "last": "22:32"
                        }
                    ]
                }
            ]
        }
    },
    "0505": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "青云街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:07",
                            "last": "22:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:00",
                            "last": "22:30"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:07",
                            "last": "22:37"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:00",
                            "last": "22:30"
                        }
                    ]
                }
            ]
        }
    },
    "0506": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "石葵路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:09",
                            "last": "22:39"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:59",
                            "last": "22:29"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:09",
                            "last": "22:39"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:59",
                            "last": "22:29"
                        }
                    ]
                }
            ]
        }
    },
    "0507": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "劳动公园",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:11",
                            "last": "22:41"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:56",
                            "last": "22:27"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:11",
                            "last": "22:41"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:56",
                            "last": "22:27"
                        }
                    ]
                }
            ]
        }
    },
    "0510": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "梭鱼湾南",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:19",
                            "last": "22:49"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:48",
                            "last": "22:18"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:19",
                            "last": "22:49"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:48",
                            "last": "22:18"
                        }
                    ]
                }
            ]
        }
    },
    "0511": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "梭鱼湾",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:21",
                            "last": "22:51"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:46",
                            "last": "22:16"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:21",
                            "last": "22:51"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:46",
                            "last": "22:16"
                        }
                    ]
                }
            ]
        }
    },
    "0512": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "甘井子街",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:23",
                            "last": "22:53"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:44",
                            "last": "22:14"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:23",
                            "last": "22:53"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:44",
                            "last": "22:14"
                        }
                    ]
                }
            ]
        }
    },
    "0513": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "甘北路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:25",
                            "last": "22:55"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:42",
                            "last": "22:12"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:25",
                            "last": "22:55"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:42",
                            "last": "22:12"
                        }
                    ]
                }
            ]
        }
    },
    "0514": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "中华东路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:28",
                            "last": "22:58"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:40",
                            "last": "22:09"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:28",
                            "last": "22:58"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:40",
                            "last": "22:09"
                        }
                    ]
                }
            ]
        }
    },
    "0515": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "泉水东",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:30",
                            "last": "23:00"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:38",
                            "last": "22:07"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:30",
                            "last": "23:00"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:38",
                            "last": "22:07"
                        }
                    ]
                }
            ]
        }
    },
    "0516": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "龙华路",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:32",
                            "last": "23:02"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:36",
                            "last": "22:06"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "up",
                            "destinationStationId": "line-last",
                            "destinationName": "后关",
                            "first": "06:32",
                            "last": "23:02"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:36",
                            "last": "22:06"
                        }
                    ]
                }
            ]
        }
    },
    "0518": {
        "DLM05": {
            "lineNo": "05",
            "lineName": "5号线",
            "stationName": "后关",
            "currentWeekday": 3,
            "schedules": [
                {
                    "includeWeekdays": [
                        2,
                        3,
                        4,
                        5,
                        6
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:30",
                            "last": "22:00"
                        }
                    ]
                },
                {
                    "includeWeekdays": [
                        7,
                        1
                    ],
                    "trainTypeName": "全程车",
                    "trainTypeCode": "qcc-05-0501-0518",
                    "directions": [
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:30",
                            "last": "22:00"
                        }
                    ]
                }
            ]
        }
    }
};



/**
 * 大连地铁官网「站点详情」编号映射（本站车站 ID → 官网 siteId）。
 *
 * 官网详情页形如 https://www.dltransgrp.com/hb-air-web/html/wxgo/stationDetail.jsp?siteId=24，
 * 其 siteId 与本站车站 ID 并不同源——既非线路次序，也非数字规律（例如本站 0113 西安路对应 12、
 * 本站 0311 金石滩对应 42），无法由规则推导，故以本站车站 ID 为键逐一登记。
 *
 * 数据来源：官网 site/ShowSite.do 接口，与本站站名逐条核对后落库。
 * 官网编号分两段：1~110 为 1/2/3/12/13 号线及其换乘站，501~518 为 5 号线；
 * 换乘站在不同线路侧各有一个编号，此处取同站名下的最小号（两侧内容一致）。
 * 官网未收录的车站不在此表：201/202 路有轨电车与国铁车站（DLT/DFT）——
 * 它们与地铁站同名，但没有对应的详情页。
 */
const DALIAN_STATION_DETAIL_SITE_ID = {
    // 1 号线
    "0101": 1,
    "0102": 2,
    "0103": 3,
    "0104": 65,
    "0105": 4,
    "0106": 5,
    "0107": 6,
    "0108": 7,
    "0109": 8,
    "0110": 9,
    "0111": 10,
    "0112": 11,
    "0113": 12,
    "0114": 13,
    "0115": 14,
    "0116": 32,
    "0117": 33,
    "0118": 34,
    "0119": 35,
    "0120": 36,
    "0121": 37,
    // 2 号线
    "0201": 41,
    "0202": 40,
    "0203": 39,
    "0204": 31,
    "0205": 30,
    "0206": 29,
    "0207": 28,
    "0208": 27,
    "0209": 26,
    "0210": 25,
    "0211": 24,
    "0212": 22,
    "0213": 21,
    "0214": 20,
    "0215": 19,
    "0216": 18,
    "0217": 17,
    "0218": 16,
    "0219": 15,
    "0220": 90,
    "0221": 103,
    "0222": 104,
    "0223": 105,
    "0224": 106,
    "0225": 107,
    "0226": 108,
    "0227": 109,
    // 3 号线及支线
    "0301": 55,
    "0302": 54,
    "0303": 53,
    "0304": 52,
    "0305": 51,
    "0306": 50,
    "0307": 49,
    "0308": 48,
    "0309": 45,
    "0310": 44,
    "0311": 42,
    "0313": 43,
    "0315": 75,
    "0316": 74,
    "0317": 73,
    "0318": 72,
    "0319": 71,
    "0320": 70,
    // 5 号线
    "0501": 501,
    "0502": 502,
    "0503": 503,
    "0504": 504,
    "0505": 505,
    "0506": 506,
    "0507": 507,
    "0510": 510,
    "0511": 511,
    "0512": 512,
    "0513": 513,
    "0514": 514,
    "0515": 515,
    "0516": 516,
    "0518": 518,
    // 12 号线
    "0801": 38,
    "0802": 62,
    "0803": 61,
    "0804": 60,
    "0805": 59,
    "0806": 58,
    "0807": 57,
    "0808": 56,
    // 13 号线
    "1321": 92,
    "1322": 93,
    "1324": 94,
    "1327": 95,
    "1328": 96,
    "1329": 97,
    "1331": 98,
    "1332": 99,
    "1333": 100,
    "1334": 101,
    "1336": 102
};

const DALIAN_STATION_DETAIL_URL = "https://www.dltransgrp.com/hb-air-web/html/wxgo/stationDetail.jsp?siteId=";

/**
 * 车站官网查询入口：按 (线路 ID, 车站 ID) 登记官网详情页链接，供车站信息板「官网查询」使用。
 * 仅收录官网已发布详情页的车站；未收录者留空即不显示入口。
 */
const GLOBAL_SCHEDULE_DATA = (function buildDalianScheduleData() {
    const LINE_STATION_IDS = {
        "DLM12": ["0801", "0802", "0803", "0804", "0805", "0806", "0807", "0808"],
        "DLM13": ["1321", "1322", "1324", "1327", "1328", "1329", "1331", "1332", "1333", "1334", "1336", "0320"],
        "DLM99": ["0320", "0319", "0318", "0317", "0316", "0315", "0308"],
        "DLM01": ["0113", "0102", "0101", "0103", "0104", "0105", "0106", "0107", "0108", "0109", "0110", "0111", "0112", "0114", "0115", "0116", "0117", "0118", "0119", "0120", "0121", "0801"],
        "DLM02": ["0201", "0202", "0203", "0204", "0205", "0206", "0207", "0208", "0209", "0210", "0211", "0113", "0212", "0213", "0214", "0215", "0216", "0217", "0218", "0219", "0220", "0221", "0222", "0223", "0224", "0225", "0226", "0227", "0102"],
        "DLM03": ["0308", "0301", "0302", "0303", "0304", "0305", "0306", "0307", "0309", "0310", "0313", "0311"],
        "DLM05": ["0301", "0305", "0208", "0501", "0502", "0503", "0504", "0505", "0506", "0507", "0510", "0511", "0512", "0513", "0514", "0515", "0516", "0518"]
    };
    const data = {};
    Object.keys(LINE_STATION_IDS).forEach(function (lineId) {
        const entries = {};
        LINE_STATION_IDS[lineId].forEach(function (stationId) {
            const siteId = DALIAN_STATION_DETAIL_SITE_ID[stationId];
            if (siteId) entries[stationId] = DALIAN_STATION_DETAIL_URL + siteId;
        });
        data[lineId] = entries;
    });
    return data;
})();

const DALIAN_TIMETABLE_SOURCE = {
    "provider": "大连公共交通建设投资集团",
    "endpoint": "https://www.dltransgrp.com/hb-air-api/site/ShowSite.do",
    "mapUrl": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102",
    "serviceId": "01",
    "retrievedAt": "2026-09-28"
};

/**
 * 大连首末班车日历覆盖配置。
 *
 * 默认按周一至周五使用工作日时刻、周六/周日使用休息日时刻；
 * holidayDates/workdayDates 用于覆盖国务院公布的放假与调休日期。
 * 2026 年日期依据国务院办公厅国办发明电〔2025〕7 号通知：
 * https://www.beijing.gov.cn/zhengce/zhengcefagui/202511/t20251104_4258873.html
 * 后续年份只需在对应年份键下追加 YYYY-MM-DD，不必改动站卡逻辑。
 */
const DALIAN_TIMETABLE_CALENDAR = {
    holidayDates: {
        "2026": [
            "2026-01-01", "2026-01-02", "2026-01-03",
            "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19",
            "2026-02-20", "2026-02-21", "2026-02-22", "2026-02-23",
            "2026-04-04", "2026-04-05", "2026-04-06",
            "2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05",
            "2026-06-19", "2026-06-20", "2026-06-21",
            "2026-09-25", "2026-09-26", "2026-09-27",
            "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"
        ]
    },
    workdayDates: {
        "2026": [
            "2026-01-04", "2026-02-14", "2026-02-28", "2026-05-09", "2026-09-20", "2026-10-10"
        ]
    }
};

const DALIAN_TIMETABLE_WORKDAY_CODES = [2, 3, 4, 5, 6];
const DALIAN_TIMETABLE_RESTDAY_CODES = [1, 7];

function getDalianDateParts(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return null;
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(value);
    const values = Object.fromEntries(parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]));
    const year = Number(values.year);
    const month = Number(values.month);
    const day = Number(values.day);
    return {
        year,
        month,
        day,
        iso: `${values.year}-${values.month}-${values.day}`,
        weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay()
    };
}

function getDalianDateKey(date) {
    return getDalianDateParts(date)?.iso || "";
}

function getDalianDateOverrideList(calendar, field, year) {
    const source = calendar?.[field];
    if (Array.isArray(source)) return source;
    if (source && Array.isArray(source[String(year)])) return source[String(year)];
    return [];
}

/** 返回当前日期应使用的时刻表类型：workday 或 restday。 */
function getDalianTimetableDayType(date = new Date(), calendar = DALIAN_TIMETABLE_CALENDAR) {
    const dateParts = getDalianDateParts(date);
    if (!dateParts) return "workday";
    const dateKey = dateParts.iso;
    const year = dateParts.year;
    if (getDalianDateOverrideList(calendar, "workdayDates", year).includes(dateKey)) return "workday";
    if (getDalianDateOverrideList(calendar, "holidayDates", year).includes(dateKey)) return "restday";
    return [0, 6].includes(dateParts.weekday) ? "restday" : "workday";
}

/** 根据日期筛选一个站点/线路信息中的工作日或休息日班次。 */
function getDalianTimetableSchedules(info, date = new Date(), calendar = DALIAN_TIMETABLE_CALENDAR) {
    const schedules = Array.isArray(info?.schedules) ? info.schedules : [];
    if (!schedules.length) return [];
    const dayType = getDalianTimetableDayType(date, calendar);
    const codes = dayType === "restday" ? DALIAN_TIMETABLE_RESTDAY_CODES : DALIAN_TIMETABLE_WORKDAY_CODES;
    const matched = schedules.filter((schedule) =>
        Array.isArray(schedule?.includeWeekdays)
        && schedule.includeWeekdays.some((weekday) => codes.includes(Number(weekday)))
    );
    return matched.length || schedules.length === 1 ? (matched.length ? matched : schedules) : [];
}

/**
 * 贯通运行区段的时刻表分组。
 *
 * 九里至开发区是13号线与3号线支线的贯通区段；开发区同时还承接3号线主线，
 * 所以开发区另设DLM03与DLM99的详情合并组。解析时返回当前站点已有的记录，
 * 不会把普通缺失数据当作官方时刻补齐。
 */
const DALIAN_TIMETABLE_THROUGH_GROUPS = [
    {
        id: "DLM13-DLM99",
        lineIds: ["DLM13", "DLM99"],
        stationIds: ["0320", "0319", "0318", "0317", "0316", "0315", "0308"]
    },
    {
        id: "DLM03-DLM99",
        lineIds: ["DLM03", "DLM99", "DLM13"],
        stationIds: ["0308"]
    }
];

/**
 * 返回某个站点/线路应展示的贯通时刻表记录。
 * @returns {Array<{lineId: string, info: Object}>}
 */
function getDalianTimetableInfoEntries(stationId, lineId, data = DALIAN_TIMETABLE_DATA) {
    const sid = String(stationId ?? "");
    const lid = String(lineId ?? "");
    if (!sid || !lid) return [];

    const groups = DALIAN_TIMETABLE_THROUGH_GROUPS.filter((item) =>
        item.stationIds.includes(sid) && item.lineIds.includes(lid)
    );
    const lineIds = groups.length
        ? [lid, ...groups.flatMap((group) => group.lineIds).filter((groupLineId, index, all) =>
            groupLineId !== lid && all.indexOf(groupLineId) === index
        )]
        : [lid];
    return lineIds
        .map((entryLineId) => {
            const info = data?.[sid]?.[entryLineId];
            return info ? { lineId: entryLineId, info } : null;
        })
        .filter(Boolean);
}

if (typeof window !== "undefined") {
    window.DALIAN_TIMETABLE_DATA = DALIAN_TIMETABLE_DATA;
    window.DALIAN_TIMETABLE_SOURCE = DALIAN_TIMETABLE_SOURCE;
    window.DALIAN_TIMETABLE_CALENDAR = DALIAN_TIMETABLE_CALENDAR;
    window.getDalianDateParts = getDalianDateParts;
    window.getDalianDateKey = getDalianDateKey;
    window.getDalianTimetableDayType = getDalianTimetableDayType;
    window.getDalianTimetableSchedules = getDalianTimetableSchedules;
    window.DALIAN_TIMETABLE_THROUGH_GROUPS = DALIAN_TIMETABLE_THROUGH_GROUPS;
    window.getDalianTimetableInfoEntries = getDalianTimetableInfoEntries;
}
