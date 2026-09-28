/**
 * CGo OpenMap - 大连官方首末班车数据
 *
 * 来源：大连公共交通建设投资集团官网线网图生产接口。
 * 接口：/bas/smartstation/v1/ipis/station/detail
 * 查询参数：service_id=01，按工作日/周末分组保留官方方向、终点、首班与末班字段。
 * 采集时间：2026-09-08T13:18:07.823Z
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
                            "first": "06:17",
                            "last": "22:47"
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
                            "first": "06:17",
                            "last": "22:47"
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
                            "first": "06:39",
                            "last": "23:09"
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
                            "first": "06:39",
                            "last": "23:09"
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
                            "first": "06:15",
                            "last": "22:45"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:57",
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
                            "first": "06:15",
                            "last": "22:45"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:57",
                            "last": "22:27"
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
                            "last": "22:53"
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
                            "last": "22:53"
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
                            "last": "23:08"
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
                            "last": "23:08"
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
                            "first": "06:12",
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
                            "first": "06:12",
                            "last": "22:42"
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
                            "first": "06:09",
                            "last": "22:39"
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
                            "first": "06:09",
                            "last": "22:39"
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
                            "first": "06:06",
                            "last": "22:36"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:06",
                            "last": "22:36"
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
                            "first": "06:06",
                            "last": "22:36"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "06:06",
                            "last": "22:36"
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
                            "first": "06:08",
                            "last": "22:38"
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
                            "first": "06:08",
                            "last": "22:38"
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
                            "first": "06:10",
                            "last": "22:40"
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
                            "first": "06:10",
                            "last": "22:40"
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
                            "first": "06:13",
                            "last": "22:43"
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
                            "first": "06:13",
                            "last": "22:43"
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
                            "first": "06:22",
                            "last": "22:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:51",
                            "last": "22:21"
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
                            "first": "06:22",
                            "last": "22:52"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:51",
                            "last": "22:21"
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
                            "first": "06:24",
                            "last": "22:54"
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
                            "first": "06:24",
                            "last": "22:54"
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
                            "first": "06:27",
                            "last": "22:57"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:45",
                            "last": "22:15"
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
                            "first": "06:27",
                            "last": "22:57"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:45",
                            "last": "22:15"
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
                            "first": "06:29",
                            "last": "22:59"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:43",
                            "last": "22:13"
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
                            "first": "06:29",
                            "last": "22:59"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:43",
                            "last": "22:13"
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
                            "first": "06:32",
                            "last": "23:02"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:40",
                            "last": "22:10"
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
                            "first": "05:40",
                            "last": "22:10"
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
                            "first": "06:34",
                            "last": "23:04"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:38",
                            "last": "22:08"
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
                            "first": "06:34",
                            "last": "23:04"
                        },
                        {
                            "direction": "down",
                            "destinationStationId": "line-first",
                            "destinationName": "虎滩新区",
                            "first": "05:38",
                            "last": "22:08"
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
                            "first": "06:37",
                            "last": "23:07"
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
                            "first": "06:37",
                            "last": "23:07"
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
 * 依据官网已经公开的3号线支线首末班车差值，补充贯通至13号线后的推算记录。
 *
 * 这里不修改官网原始记录，只在缺少DLM13记录的支线车站新增明确标记的估算对象：
 * 例如十九局开往开发区的首班比九里晚3分钟，则反推开往普兰店振兴街的首班比九里早3分钟。
 *
 * destinationStationId 已与沈阳统一语义：线路端点写 "line-first" / "line-last" 代号，
 * 非端点的贯通区间车保留站 ID，因此本配置也用代号表达（DLM99 与 DLM13 的末站方向）。
 */
const DALIAN_TIMETABLE_ESTIMATE_INFO = {};
const DALIAN_TIMETABLE_ESTIMATE_CONFIG = {
    sourceLineId: "DLM99",
    targetLineId: "DLM13",
    referenceStationId: "0320",
    sourceDestinationStationId: "line-last",
    targetDestinationStationId: "line-last",
    stationIds: ["0319", "0318", "0317", "0316", "0315"]
};

function getDalianTimetableScheduleKey(schedule) {
    return Array.isArray(schedule?.includeWeekdays)
        ? schedule.includeWeekdays.map(Number).sort((a, b) => a - b).join(",")
        : "";
}

function getDalianTimetableScheduleByKey(info, key) {
    const schedules = Array.isArray(info?.schedules) ? info.schedules : [];
    return schedules.find((schedule) => getDalianTimetableScheduleKey(schedule) === key) || null;
}

function getDalianTimetableDirection(schedule, destinationStationId) {
    return (Array.isArray(schedule?.directions) ? schedule.directions : [])
        .find((direction) => String(direction?.destinationStationId) === String(destinationStationId)) || null;
}

function parseDalianTimetableTime(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ""));
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
}

function formatDalianTimetableTime(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function shiftDalianTimetableTime(value, deltaMinutes) {
    const minutes = parseDalianTimetableTime(value);
    if (minutes === null || !Number.isFinite(deltaMinutes)) return "";
    return formatDalianTimetableTime(minutes + deltaMinutes);
}

function addDalianEstimatedThroughTimetables(data = DALIAN_TIMETABLE_DATA) {
    const config = DALIAN_TIMETABLE_ESTIMATE_CONFIG;
    const referenceInfo = data?.[config.referenceStationId]?.[config.sourceLineId];
    const targetInfo = data?.[config.referenceStationId]?.[config.targetLineId];
    if (!referenceInfo || !targetInfo) return;

    config.stationIds.forEach((stationId) => {
        const stationData = data?.[stationId];
        const sourceInfo = stationData?.[config.sourceLineId];
        if (!stationData || !sourceInfo || stationData[config.targetLineId]) return;

        const estimateDetails = [];
        const schedules = (Array.isArray(sourceInfo.schedules) ? sourceInfo.schedules : [])
            .map((sourceSchedule) => {
                const scheduleKey = getDalianTimetableScheduleKey(sourceSchedule);
                const referenceSchedule = getDalianTimetableScheduleByKey(referenceInfo, scheduleKey);
                const targetSchedule = getDalianTimetableScheduleByKey(targetInfo, scheduleKey);
                const sourceDirection = getDalianTimetableDirection(sourceSchedule, config.sourceDestinationStationId);
                const referenceDirection = getDalianTimetableDirection(referenceSchedule, config.sourceDestinationStationId);
                const targetDirection = getDalianTimetableDirection(targetSchedule, config.targetDestinationStationId);
                if (!referenceDirection || !sourceDirection || !targetDirection) return null;

                const sourceFirst = parseDalianTimetableTime(sourceDirection.first);
                const referenceFirst = parseDalianTimetableTime(referenceDirection.first);
                const sourceLast = parseDalianTimetableTime(sourceDirection.last);
                const referenceLast = parseDalianTimetableTime(referenceDirection.last);
                if (![sourceFirst, referenceFirst, sourceLast, referenceLast].every(Number.isFinite)) return null;
                const firstOffset = sourceFirst - referenceFirst;
                const lastOffset = sourceLast - referenceLast;
                const first = shiftDalianTimetableTime(targetDirection.first, -firstOffset);
                const last = shiftDalianTimetableTime(targetDirection.last, -lastOffset);
                if (!first || !last) return null;

                const estimate = {
                    method: "DLM99站间首末班车差值反推",
                    confidence: "medium",
                    referenceStationId: config.referenceStationId,
                    sourceLineId: config.sourceLineId,
                    sourceDestinationStationId: config.sourceDestinationStationId,
                    offsetMinutes: { first: firstOffset, last: lastOffset }
                };
                estimateDetails.push({
                    includeWeekdays: [...(sourceSchedule.includeWeekdays || [])],
                    offsetMinutes: estimate.offsetMinutes
                });

                return {
                    includeWeekdays: [...(sourceSchedule.includeWeekdays || [])],
                    trainTypeName: targetSchedule.trainTypeName || "全程车",
                    trainTypeCode: targetSchedule.trainTypeCode || "qcc-13-1321-1336",
                    directions: [{
                        direction: "up",
                        destinationStationId: config.targetDestinationStationId,
                        destinationName: targetDirection.destinationName || "普兰店振兴街",
                        first,
                        last,
                        isEstimated: true,
                        estimate
                    }]
                };
            })
            .filter(Boolean);

        if (!schedules.length) return;
        const estimateInfo = {
            isEstimated: true,
            method: "DLM99站间首末班车差值反推",
            confidence: "medium",
            sourceLineId: config.sourceLineId,
            referenceStationId: config.referenceStationId,
            targetDestinationStationId: config.targetDestinationStationId,
            offsets: estimateDetails
        };
        stationData[config.targetLineId] = {
            lineNo: "13",
            lineName: "13号线",
            stationName: sourceInfo.stationName,
            currentWeekday: sourceInfo.currentWeekday,
            isEstimated: true,
            estimate: estimateInfo,
            schedules
        };
        DALIAN_TIMETABLE_ESTIMATE_INFO[stationId] = estimateInfo;
    });
}

addDalianEstimatedThroughTimetables();

/**
 * 开发区缺少官方“开往普兰店振兴街”记录，按九里端13号线时刻反推终点站时刻。
 * 21分钟是由3号线支线各站首末班差值累计得到的近似运行时间，因此单独标为低置信度。
 */
function addDalianEstimatedDevelopmentZoneTimetable(data = DALIAN_TIMETABLE_DATA) {
    const stationId = "0308";
    const lineId = "DLM13";
    const referenceStationId = "0320";
    const referenceInfo = data?.[referenceStationId]?.[lineId];
    const stationData = data?.[stationId];
    if (!referenceInfo || !stationData || stationData[lineId]) return;

    const travelMinutes = { first: 21, last: 21 };
    const schedules = (Array.isArray(referenceInfo.schedules) ? referenceInfo.schedules : [])
        .map((referenceSchedule) => {
            const direction = getDalianTimetableDirection(
                referenceSchedule,
                DALIAN_TIMETABLE_ESTIMATE_CONFIG.targetDestinationStationId
            );
            if (!direction) return null;
            const first = shiftDalianTimetableTime(direction.first, -travelMinutes.first);
            const last = shiftDalianTimetableTime(direction.last, -travelMinutes.last);
            if (!first || !last) return null;
            const estimate = {
                method: "DLM99支线首末班车差值累计反推",
                confidence: "low",
                referenceStationId,
                sourceLineId: "DLM99",
                travelMinutes: { ...travelMinutes }
            };
            return {
                includeWeekdays: [...(referenceSchedule.includeWeekdays || [])],
                trainTypeName: referenceSchedule.trainTypeName || "全程车",
                trainTypeCode: referenceSchedule.trainTypeCode || "qcc-13-1321-1336",
                directions: [{
                    direction: "up",
                    destinationStationId: DALIAN_TIMETABLE_ESTIMATE_CONFIG.targetDestinationStationId,
                    destinationName: direction.destinationName || "普兰店振兴街",
                    first,
                    last,
                    isEstimated: true,
                    estimate
                }]
            };
        })
        .filter(Boolean);
    if (!schedules.length) return;

    const estimateInfo = {
        isEstimated: true,
        method: "DLM99支线首末班车差值累计反推",
        confidence: "low",
        sourceLineId: "DLM99",
        referenceStationId,
        travelMinutes: { ...travelMinutes }
    };
    stationData[lineId] = {
        lineNo: "13",
        lineName: "13号线",
        stationName: stationData.DLM99?.stationName || "开发区",
        currentWeekday: stationData.DLM99?.currentWeekday,
        isEstimated: true,
        estimate: estimateInfo,
        schedules
    };
    DALIAN_TIMETABLE_ESTIMATE_INFO[stationId] = estimateInfo;
}

addDalianEstimatedDevelopmentZoneTimetable();

const GLOBAL_SCHEDULE_DATA = {
    "DLM12": {
        "0801": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0801",
        "0802": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0802",
        "0803": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0803",
        "0804": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0804",
        "0805": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0805",
        "0806": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0806",
        "0807": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0807",
        "0808": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0808"
    },
    "DLM13": {
        "1321": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1321",
        "1322": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1322",
        "1324": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1324",
        "1327": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1327",
        "1328": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1328",
        "1329": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1329",
        "1331": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1331",
        "1332": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1332",
        "1333": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1333",
        "1334": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1334",
        "1336": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=1336",
        "0320": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0320"
    },
    "DLM99": {
        "0320": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0320",
        "0319": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0319",
        "0318": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0318",
        "0317": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0317",
        "0316": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0316",
        "0315": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0315",
        "0308": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0308"
    },
    "DLM01": {
        "0113": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0113",
        "0102": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0102",
        "0101": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0101",
        "0103": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0103",
        "0104": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0104",
        "0105": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0105",
        "0106": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0106",
        "0107": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0107",
        "0108": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0108",
        "0109": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0109",
        "0110": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0110",
        "0111": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0111",
        "0112": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0112",
        "0114": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0114",
        "0115": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0115",
        "0116": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0116",
        "0117": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0117",
        "0118": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0118",
        "0119": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0119",
        "0120": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0120",
        "0121": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0121",
        "0801": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0801"
    },
    "DLM02": {
        "0201": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0201",
        "0202": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0202",
        "0203": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0203",
        "0204": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0204",
        "0205": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0205",
        "0206": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0206",
        "0207": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0207",
        "0208": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0208",
        "0209": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0209",
        "0210": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0210",
        "0211": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0211",
        "0113": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0113",
        "0212": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0212",
        "0213": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0213",
        "0214": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0214",
        "0215": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0215",
        "0216": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0216",
        "0217": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0217",
        "0218": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0218",
        "0219": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0219",
        "0220": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0220",
        "0221": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0221",
        "0222": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0222",
        "0223": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0223",
        "0224": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0224",
        "0225": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0225",
        "0226": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0226",
        "0227": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0227",
        "0102": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0102"
    },
    "DLM03": {
        "0308": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0308",
        "0301": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0301",
        "0302": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0302",
        "0303": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0303",
        "0304": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0304",
        "0305": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0305",
        "0306": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0306",
        "0307": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0307",
        "0309": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0309",
        "0310": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0310",
        "0313": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0313",
        "0311": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0311"
    },
    "DLM05": {
        "0301": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0301",
        "0305": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0305",
        "0208": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0208",
        "0501": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0501",
        "0502": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0502",
        "0503": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0503",
        "0504": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0504",
        "0505": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0505",
        "0506": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0506",
        "0507": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0507",
        "0510": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0510",
        "0511": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0511",
        "0512": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0512",
        "0513": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0513",
        "0514": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0514",
        "0515": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0515",
        "0516": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0516",
        "0518": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102&station_no=0518"
    }
};

const DALIAN_TIMETABLE_SOURCE = {
    "provider": "大连公共交通建设投资集团",
    "endpoint": "https://ecx.dlmetro.com/bas/smartstation/v1/ipis/station/detail",
    "mapUrl": "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102",
    "serviceId": "01",
    "retrievedAt": "2026-09-08T13:18:07.823Z"
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
 * 所以开发区另设DLM03与DLM99的详情合并组。解析时返回当前站点已有的官方记录，
 * 以及上方明确标记为isEstimated的推算记录，不会把普通缺失数据当作官方时刻补齐。
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
    window.DALIAN_TIMETABLE_ESTIMATE_INFO = DALIAN_TIMETABLE_ESTIMATE_INFO;
    window.getDalianTimetableInfoEntries = getDalianTimetableInfoEntries;
}
