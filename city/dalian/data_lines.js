/**
 * CGo OpenMap - 大连运营线路数据库 (city/dalian/data_lines.js)
 *
 * 收录官网线网图中展示的运营线路：1、2、3、5、12、13 号线及 3 号线支线。
 * 路径控制点按压缩后的站点坐标重新整理：相邻控制点仅使用水平、竖直或 ±45° 斜线。
 * 未取得可靠站间距来源，故不填 distances，避免将示意图像素距离误作实际运营里程。
 */

const linesData = [
    {
        id: "Rwy", // 记录地图上单独的铁路车站站点
        name: "中国铁路",
        svg: "icon@56.svg",
        svgclr: "#00263b",
        svgtext: "#ffffff",
        company: "中国铁路沈阳局",
        color: "#bdcbd2",
        overlayStyle: { color: "#00263b", width: 3.4, opacity: 0.5, dashArray: "12, 12" },
        isPointOnly: true,
        // 记得在这里把相关站点的 stationIds 加进去
        stationIds: ["DLB", "DLZ"],
        distances: [],
        pathPoints: []
    },
    {
        "id": "DLM99",
        "name": "3号线支线",
        "color": "#E4007F",
        "svg": "icon@03.svg",
        "company": "大连交通集团大连地铁公司三号线分公司",
        "stationIds": [
            "0320",
            "0319",
            "0318",
            "0317",
            "0316",
            "0315",
            "0308"
        ],
        "pathPoints": [
            {
                "x": 1302,
                "y": 263
            },
            {
                "x": 1282,
                "y": 283
            },
            {
                "x": 1282,
                "y": 465
            }
        ]
    },
    {
        "id": "DLM03",
        "name": "3号线",
        "color": "#E4007F",
        "svg": "icon@03.svg",
        "company": "大连交通集团大连地铁公司三号线分公司",
        "stationIds": [
            "0301",
            "0302",
            "0303",
            "0304",
            "0305",
            "0306",
            "0307",
            "0308",
            "0309",
            "0310",
            "0313",
            "0311"
        ],
        "pathPoints": [
            {
                "x": 1115,
                "y": 729
            },
            {
                "x": 1021,
                "y": 729
            },
            {
                "x": 1021,
                "y": 465
            },
            {
                "x": 1503,
                "y": 465
            }
        ]
    },
    {
        "id": "DLM02",
        "name": "2号线",
        "color": "#0097E0",
        "svg": "icon@02.svg",
        "company": "大连交通集团大连地铁公司二号线分公司",
        "stationIds": [
            "0201",
            "0202",
            "0203",
            "0204",
            "0205",
            "0206",
            "0207",
            "0208",
            "0209",
            "0210",
            "0211",
            "0113",
            "0212",
            "0213",
            "0214",
            "0215",
            "0216",
            "0217",
            "0218",
            "0219",
            "0220",
            "0221",
            "0222",
            "0223",
            "0224",
            "0225",
            "0226",
            "0227",
            "0102"
        ],
        "pathPoints": [
            {
                "x": 1399,
                "y": 796
            },
            {
                "x": 633,
                "y": 796
            },
            {
                "x": 633,
                "y": 456
            },
            {
                "x": 922,
                "y": 456
            }
        ]
    },
    {
        "id": "DLM01",
        "name": "1号线",
        "color": "#22AC38",
        "svg": "icon@01.svg",
        "company": "大连交通集团大连地铁公司一号线分公司",
        "stationIds": [
            "0101",
            "0102",
            "0103",
            "0104",
            "0105",
            "0106",
            "0107",
            "0108",
            "0109",
            "0110",
            "0111",
            "0112",
            "0113",
            "0114",
            "0115",
            "0116",
            "0117",
            "0118",
            "0119",
            "0120",
            "0121",
            "0801"
        ],
        "pathPoints": [
            {
                "x": 922,
                "y": 405
            },
            {
                "x": 922,
                "y": 967
            },
            {
                "x": 776,
                "y": 1113
            },
            {
                "x": 749,
                "y": 1140
            },
            {
                "x": 710,
                "y": 1140
            }
        ]
    },
    {
        "id": "DLM12",
        "name": "12号线",
        "color": "#4D4398",
        "svg": "icon@12.svg",
        "company": "大连交通集团大连地铁公司十二号线分公司",
        "stationIds": [
            "0801",
            "0802",
            "0803",
            "0804",
            "0805",
            "0806",
            "0807",
            "0808"
        ],
        "pathPoints": [
            {
                "x": 710,
                "y": 1140
            },
            {
                "x": 370,
                "y": 1140
            }
        ]
    },
    {
        "id": "DLM05",
        "name": "5号线",
        "color": "#EF1818",
        "svg": "icon@05.svg",
        "company": "中铁大连地铁五号线有限公司‌",
        "stationIds": [
            "0501",
            "0502",
            "0503",
            "0504",
            "0505",
            "0506",
            "0507",
            "0208",
            "0301",
            "0510",
            "0511",
            "0512",
            "0513",
            "0514",
            "0515",
            "0516",
            "0305",
            "0518"
        ],
        "pathPoints": [
            {
                "x": 1234,
                "y": 1056
            },
            {
                "x": 1115,
                "y": 937
            },
            {
                "x": 1115,
                "y": 391
            }
        ]
    },
    {
        "id": "DLM13",
        "name": "13号线",
        "color": "#FDD000",
        "svg": "icon@13.svg",
        "company": "大连交通集团大连地铁公司十三号线分公司",
        "stationIds": [
            "0320",
            "1321",
            "1322",
            "1324",
            "1327",
            "1328",
            "1329",
            "1331",
            "1332",
            "1333",
            "1334",
            "1336"
        ],
        "pathPoints": [
            {
                "x": 1302,
                "y": 263
            },
            {
                "x": 1338,
                "y": 227
            },
            {
                "x": 1763,
                "y": 227
            },
            {
                "x": 1806,
                "y": 184
            }
        ]
    },
    {
        "id": "DL201",
        "name": "201路",
        "color": "#e35225",
        "svg": "./city/dalian/assets/tram-201.svg",
        "company": "大连交通集团",
        overlayStyle: { color: "white", width: 1.6, opacity: 1, dashArray: "0, 0" },
        "stationIds": [
            "20101",
            "20102",
            "20103",
            "20104",
            "20105",
            "20106",
            "20107",
            "20108",
            "20109",
            "20110",
            "20111",
            "20112",
            "20113",
            "20114",
            "20115",
            "20116",
            "20117",
        ],
        pathPoints: [
            { x: 932, y: 759 },
            { x: 1225, y: 759 },
            { x: 1225, y: 845 },
            { x: 1300, y: 845 },
        ]
    },
    {
        "id": "DL201-1",
        "name": "201路区间",
        "color": "#e35225",
        "svg": "./city/dalian/assets/tram-201-interval.svg",
        "company": "大连交通集团",
        overlayStyle: { color: "white", width: 1.6, opacity: 1, dashArray: "0, 0" },
        "stationIds": [
            "20117-1",
            "20118",
            "20119",
            "20120",
        ],
        pathPoints: [
            { x: 1310, y: 845 },
            { x: 1380, y: 845 },
        ]
    },
    {
        "id": "DL202",
        "name": "202路",
        "color": "#2ddcb6",
        "svg": "./city/dalian/assets/tram-202.svg",
        "company": "大连交通集团",
        overlayStyle: { color: "white", width: 1.6, opacity: 1, dashArray: "0, 0" },
        "stationIds": [
            "20201",
            "20202",
            "20203",
            "20204",
            "20205",
            "20206",
            "20207",
            "20208",
            "20209",
            "20210",
            "20211",
            "20212",
            "20213",
            "20214",
            "20215",
            "20216",
            "20217",
            "20218",
            "20219"
        ],
        pathPoints: [
            { x: 912, y: 759 },
            { x: 912, y: 963 },
            { x: 765, y: 1110 },
            { x: 660, y: 1110 },
        ]
    },
];

const LINE_META = {};

if (typeof window !== "undefined") {
    window.linesData = linesData;
    window.LINE_META = LINE_META;
    window._GLOBAL_LINE_META = LINE_META;
    if (window.DALIAN_CITY) window.DALIAN_CITY.LINE_META = LINE_META;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LINE_META = LINE_META;
}
