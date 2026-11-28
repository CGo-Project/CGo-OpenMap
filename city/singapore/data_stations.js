// Station and label positions: LTA Chinese SM_CH_(Ver210726)_CCL6; real eight-direction label anchors.
// Label offsets allow for the custom sign sizes. Code/name/fare-area identities are preserved.
const stationsData = {
  "NS1": {
    "type": "tsf",
    "x": 668.331,
    "y": 1421.549,
    "cn": "裕廊东",
    "en": "Jurong East",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 15.8
    },
    "aliases": [
      "NS1",
      "EW24",
      "Jurong East",
      "裕廊东",
      "NS1 / EW24"
    ],
    "stationCodes": "NS1 / EW24"
  },
  "NS2": {
    "type": "dot",
    "x": 666.611,
    "y": 1218.666,
    "cn": "武吉巴督",
    "en": "Bukit Batok",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "NS2",
      "Bukit Batok",
      "武吉巴督"
    ],
    "stationCodes": "NS2"
  },
  "NS3": {
    "type": "dot",
    "x": 666.611,
    "y": 1066.152,
    "cn": "武吉甘柏",
    "en": "Bukit Gombak",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "NS3",
      "Bukit Gombak",
      "武吉甘柏"
    ],
    "stationCodes": "NS3"
  },
  "NS4": {
    "type": "tsf",
    "x": 687.384,
    "y": 891.316,
    "cn": "蔡厝港",
    "en": "Choa Chu Kang",
    "align": "bottom-right",
    "offset": {
      "x": -0.301,
      "y": 15.0
    },
    "aliases": [
      "NS4",
      "BP1",
      "Choa Chu Kang",
      "蔡厝港",
      "NS4 / BP1"
    ],
    "stationCodes": "NS4 / BP1"
  },
  "NS5": {
    "type": "dot",
    "x": 670.805,
    "y": 708.58,
    "cn": "油池",
    "en": "Yew Tee",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "NS5",
      "Yew Tee",
      "油池"
    ],
    "stationCodes": "NS5"
  },
  "NS7": {
    "type": "dot",
    "x": 670.805,
    "y": 536.896,
    "cn": "克兰芝",
    "en": "Kranji",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "NS7",
      "Kranji",
      "克兰芝"
    ],
    "stationCodes": "NS7"
  },
  "NS8": {
    "type": "dot",
    "x": 762.075,
    "y": 340.229,
    "cn": "马西岭",
    "en": "Marsiling",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "NS8",
      "Marsiling",
      "马西岭"
    ],
    "stationCodes": "NS8"
  },
  "NS9": {
    "type": "tsf",
    "x": 996.69,
    "y": 297.92,
    "cn": "兀兰",
    "en": "Woodlands",
    "align": "top-left",
    "offset": {
      "x": -57.32,
      "y": -7.464
    },
    "aliases": [
      "NS9",
      "TE2",
      "Woodlands",
      "兀兰",
      "NS9 / TE2"
    ],
    "stationCodes": "NS9 / TE2"
  },
  "NS10": {
    "type": "dot",
    "x": 1145.58,
    "y": 299.091,
    "cn": "海军部",
    "en": "Admiralty",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -12.3
    },
    "aliases": [
      "NS10",
      "Admiralty",
      "海军部"
    ],
    "stationCodes": "NS10"
  },
  "NS11": {
    "type": "dot",
    "x": 1282.611,
    "y": 299.091,
    "cn": "三巴旺",
    "en": "Sembawang",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -12.3
    },
    "aliases": [
      "NS11",
      "Sembawang",
      "三巴旺"
    ],
    "stationCodes": "NS11"
  },
  "NS12": {
    "type": "dot",
    "x": 1419.643,
    "y": 299.091,
    "cn": "坎贝拉",
    "en": "Canberra",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -12.3
    },
    "aliases": [
      "NS12",
      "Canberra",
      "坎贝拉"
    ],
    "stationCodes": "NS12"
  },
  "NS13": {
    "type": "dot",
    "x": 1561.41,
    "y": 343.91,
    "cn": "义顺",
    "en": "Yishun",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS13",
      "Yishun",
      "义顺"
    ],
    "stationCodes": "NS13"
  },
  "NS14": {
    "type": "dot",
    "x": 1634.699,
    "y": 432.127,
    "cn": "卡迪",
    "en": "Khatib",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS14",
      "Khatib",
      "卡迪"
    ],
    "stationCodes": "NS14"
  },
  "NS15": {
    "type": "dot",
    "x": 1653.08,
    "y": 536.896,
    "cn": "杨厝港",
    "en": "Yio Chu Kang",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS15",
      "Yio Chu Kang",
      "杨厝港"
    ],
    "stationCodes": "NS15"
  },
  "NS16": {
    "type": "dot",
    "x": 1654.081,
    "y": 641.665,
    "cn": "宏茂桥",
    "en": "Ang Mo Kio",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS16",
      "Ang Mo Kio",
      "宏茂桥"
    ],
    "stationCodes": "NS16"
  },
  "NS17": {
    "type": "tsf",
    "x": 1653.564,
    "y": 762.073,
    "cn": "碧山",
    "en": "Bishan",
    "align": "top-right",
    "offset": {
      "x": 12.503,
      "y": -15.0
    },
    "aliases": [
      "NS17",
      "CC15",
      "Bishan",
      "碧山",
      "NS17 / CC15"
    ],
    "stationCodes": "NS17 / CC15"
  },
  "NS18": {
    "type": "dot",
    "x": 1653.22,
    "y": 832.616,
    "cn": "布莱德",
    "en": "Braddell",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS18",
      "Braddell",
      "布莱德"
    ],
    "stationCodes": "NS18"
  },
  "NS19": {
    "type": "dot",
    "x": 1653.22,
    "y": 933.331,
    "cn": "大巴窑",
    "en": "Toa Payoh",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS19",
      "Toa Payoh",
      "大巴窑"
    ],
    "stationCodes": "NS19"
  },
  "NS20": {
    "type": "dot",
    "x": 1593.585,
    "y": 1050.369,
    "cn": "诺维娜",
    "en": "Novena",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS20",
      "Novena",
      "诺维娜"
    ],
    "stationCodes": "NS20"
  },
  "NS21": {
    "type": "tsfo",
    "x": 1509.968,
    "y": 1136.877,
    "cn": "纽顿",
    "en": "Newton",
    "align": "bottom-right",
    "offset": {
      "x": 4.27,
      "y": 15.0
    },
    "aliases": [
      "Newton",
      "NS21",
      "纽顿"
    ],
    "physicalHubId": "newton",
    "paidAreaTransfer": {
      "peerId": "DT11",
      "peerCode": "DT11",
      "peerLine": "滨海市区线",
      "limitMinutes": 15
    },
    "stationCodes": "NS21"
  },
  "NS22": {
    "type": "tsf",
    "x": 1393.695,
    "y": 1288.832,
    "cn": "乌节",
    "en": "Orchard",
    "align": "right",
    "offset": {
      "x": 66.28,
      "y": 0.0
    },
    "aliases": [
      "NS22",
      "TE14",
      "Orchard",
      "乌节",
      "TE14 / NS22"
    ],
    "stationCodes": "TE14 / NS22"
  },
  "NS23": {
    "type": "dot",
    "x": 1498.263,
    "y": 1396.715,
    "cn": "索美塞",
    "en": "Somerset",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS23",
      "Somerset",
      "索美塞"
    ],
    "stationCodes": "NS23"
  },
  "NS24": {
    "type": "tsf",
    "x": 1673.384,
    "y": 1524.955,
    "cn": "多美歌",
    "en": "Dhoby Ghaut",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -15.8
    },
    "aliases": [
      "NS24",
      "CC1",
      "NE6",
      "Dhoby Ghaut",
      "多美歌",
      "NS24 / NE6 / CC1"
    ],
    "stationCodes": "NS24 / NE6 / CC1"
  },
  "NS25": {
    "type": "tsf",
    "x": 1867.826,
    "y": 1764.979,
    "cn": "政府大厦",
    "en": "City Hall",
    "align": "right",
    "offset": {
      "x": 66.28,
      "y": 0.0
    },
    "aliases": [
      "NS25",
      "EW13",
      "City Hall",
      "政府大厦",
      "NS25 / EW13"
    ],
    "stationCodes": "NS25 / EW13"
  },
  "NS26": {
    "type": "tsf",
    "x": 1867.826,
    "y": 1863.756,
    "cn": "莱佛士坊",
    "en": "Raffles Place",
    "align": "bottom-right",
    "offset": {
      "x": 12.091,
      "y": 15.0
    },
    "aliases": [
      "NS26",
      "EW14",
      "Raffles Place",
      "莱佛士坊",
      "NS26 / EW14"
    ],
    "stationCodes": "NS26 / EW14"
  },
  "NS27": {
    "type": "tsf",
    "x": 1925.577,
    "y": 2016.437,
    "cn": "滨海湾",
    "en": "Marina Bay",
    "align": "bottom-right",
    "offset": {
      "x": 98.92,
      "y": 4.202
    },
    "aliases": [
      "NS27",
      "CC33",
      "TE20",
      "Marina Bay",
      "滨海湾",
      "NS27 / TE20 / CC33"
    ],
    "stationCodes": "NS27 / TE20 / CC33"
  },
  "NS28": {
    "type": "dot",
    "x": 1984.421,
    "y": 2105.234,
    "cn": "滨海南码头",
    "en": "Marina South Pier",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NS28",
      "Marina South Pier",
      "滨海南码头"
    ],
    "stationCodes": "NS28"
  },
  "EW1": {
    "type": "dot",
    "x": 2922.877,
    "y": 759.819,
    "cn": "巴西立",
    "en": "Pasir Ris",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "EW1",
      "Pasir Ris",
      "巴西立"
    ],
    "stationCodes": "EW1"
  },
  "EW2": {
    "type": "tsfo",
    "x": 2923.783,
    "y": 841.719,
    "cn": "淡滨尼",
    "en": "Tampines",
    "align": "right",
    "offset": {
      "x": 29.16,
      "y": 0.0
    },
    "aliases": [
      "Tampines",
      "淡滨尼",
      "EW2"
    ],
    "physicalHubId": "tampines",
    "paidAreaTransfer": {
      "peerId": "DT32",
      "peerCode": "DT32",
      "peerLine": "滨海市区线",
      "limitMinutes": 15
    },
    "stationCodes": "EW2"
  },
  "EW3": {
    "type": "dot",
    "x": 2922.877,
    "y": 942.092,
    "cn": "四美",
    "en": "Simei",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "EW3",
      "Simei",
      "四美"
    ],
    "stationCodes": "EW3"
  },
  "EW4": {
    "type": "tsf",
    "x": 2912.905,
    "y": 1001.525,
    "cn": "丹那美拉",
    "en": "Tanah Merah",
    "align": "bottom-left",
    "offset": {
      "x": 19.276,
      "y": 15.0
    },
    "aliases": [
      "EW4",
      "Tanah Merah",
      "CG",
      "丹那美拉",
      "EW4 / CG"
    ],
    "stationCodes": "EW4 / CG"
  },
  "EW5": {
    "type": "dot",
    "x": 2700.922,
    "y": 1001.314,
    "cn": "勿洛",
    "en": "Bedok",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "EW5",
      "Bedok",
      "勿洛"
    ],
    "stationCodes": "EW5"
  },
  "EW6": {
    "type": "dot",
    "x": 2544.351,
    "y": 1085.344,
    "cn": "景万岸",
    "en": "Kembangan",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "EW6",
      "Kembangan",
      "景万岸"
    ],
    "stationCodes": "EW6"
  },
  "EW7": {
    "type": "dot",
    "x": 2449.07,
    "y": 1180.063,
    "cn": "友诺士",
    "en": "Eunos",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "EW7",
      "Eunos",
      "友诺士"
    ],
    "stationCodes": "EW7"
  },
  "EW8": {
    "type": "tsf",
    "x": 2351.608,
    "y": 1283.868,
    "cn": "巴耶利峇",
    "en": "Paya Lebar",
    "align": "right",
    "offset": {
      "x": 57.32,
      "y": 0.0
    },
    "aliases": [
      "EW8",
      "CC9",
      "Paya Lebar",
      "巴耶利峇",
      "EW8 / CC9"
    ],
    "stationCodes": "EW8 / CC9"
  },
  "EW9": {
    "type": "dot",
    "x": 2259.211,
    "y": 1371.311,
    "cn": "阿裕尼",
    "en": "Aljunied",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "EW9",
      "Aljunied",
      "阿裕尼"
    ],
    "stationCodes": "EW9"
  },
  "EW10": {
    "type": "dot",
    "x": 2191.18,
    "y": 1440.319,
    "cn": "加冷",
    "en": "Kallang",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW10",
      "Kallang",
      "加冷"
    ],
    "stationCodes": "EW10"
  },
  "EW11": {
    "type": "dot",
    "x": 2118.664,
    "y": 1513.794,
    "cn": "劳明达",
    "en": "Lavender",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW11",
      "Lavender",
      "劳明达"
    ],
    "stationCodes": "EW11"
  },
  "EW12": {
    "type": "tsf",
    "x": 2037.428,
    "y": 1595.157,
    "cn": "武吉士",
    "en": "Bugis",
    "align": "right",
    "offset": {
      "x": 66.28,
      "y": 0.0
    },
    "aliases": [
      "EW12",
      "DT14",
      "Bugis",
      "武吉士",
      "EW12 / DT14"
    ],
    "stationCodes": "EW12 / DT14"
  },
  "EW15": {
    "type": "dot",
    "x": 1574.247,
    "y": 1911.38,
    "cn": "丹戎巴葛",
    "en": "Tanjong Pagar",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "EW15",
      "Tanjong Pagar",
      "丹戎巴葛"
    ],
    "stationCodes": "EW15"
  },
  "EW16": {
    "type": "tsf",
    "x": 1475.425,
    "y": 1762.524,
    "cn": "欧南园",
    "en": "Outram Park",
    "align": "left",
    "offset": {
      "x": -94.44,
      "y": 0.0
    },
    "aliases": [
      "EW16",
      "TE17",
      "NE3",
      "Outram Park",
      "欧南园",
      "EW16 / NE3 / TE17"
    ],
    "stationCodes": "EW16 / NE3 / TE17"
  },
  "EW17": {
    "type": "dot",
    "x": 1345.084,
    "y": 1691.219,
    "cn": "中峇鲁",
    "en": "Tiong Bahru",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "EW17",
      "Tiong Bahru",
      "中峇鲁"
    ],
    "stationCodes": "EW17"
  },
  "EW18": {
    "type": "dot",
    "x": 1273.379,
    "y": 1617.935,
    "cn": "红山",
    "en": "Redhill",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW18",
      "Redhill",
      "红山"
    ],
    "stationCodes": "EW18"
  },
  "EW19": {
    "type": "dot",
    "x": 1196.517,
    "y": 1546.751,
    "cn": "女皇镇",
    "en": "Queenstown",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW19",
      "Queenstown",
      "女皇镇"
    ],
    "stationCodes": "EW19"
  },
  "EW20": {
    "type": "dot",
    "x": 1135.578,
    "y": 1487.323,
    "cn": "联邦",
    "en": "Commonwealth",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW20",
      "Commonwealth",
      "联邦"
    ],
    "stationCodes": "EW20"
  },
  "EW21": {
    "type": "tsf",
    "x": 1039.474,
    "y": 1420.196,
    "cn": "波那维斯达",
    "en": "Buona Vista",
    "align": "right",
    "offset": {
      "x": 66.28,
      "y": 0.0
    },
    "aliases": [
      "EW21",
      "CC22",
      "Buona Vista",
      "波那维斯达",
      "CC22 / EW21"
    ],
    "stationCodes": "CC22 / EW21"
  },
  "EW22": {
    "type": "dot",
    "x": 925.428,
    "y": 1421.582,
    "cn": "杜弗",
    "en": "Dover",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "EW22",
      "Dover",
      "杜弗"
    ],
    "stationCodes": "EW22"
  },
  "EW23": {
    "type": "dot",
    "x": 821.088,
    "y": 1421.483,
    "cn": "金文泰",
    "en": "Clementi",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "EW23",
      "Clementi",
      "金文泰"
    ],
    "stationCodes": "EW23"
  },
  "EW25": {
    "type": "dot",
    "x": 543.528,
    "y": 1421.458,
    "cn": "裕华园",
    "en": "Chinese Garden",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "EW25",
      "Chinese Garden",
      "裕华园"
    ],
    "stationCodes": "EW25"
  },
  "EW26": {
    "type": "dot",
    "x": 428.717,
    "y": 1421.458,
    "cn": "湖畔",
    "en": "Lakeside",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "EW26",
      "Lakeside",
      "湖畔"
    ],
    "stationCodes": "EW26"
  },
  "EW27": {
    "type": "dot",
    "x": 322.146,
    "y": 1309.508,
    "cn": "文礼",
    "en": "Boon Lay",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW27",
      "Boon Lay",
      "文礼"
    ],
    "stationCodes": "EW27"
  },
  "EW28": {
    "type": "dot",
    "x": 322.146,
    "y": 1218.719,
    "cn": "先驱",
    "en": "Pioneer",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW28",
      "Pioneer",
      "先驱"
    ],
    "stationCodes": "EW28"
  },
  "EW29": {
    "type": "dot",
    "x": 322.146,
    "y": 1127.93,
    "cn": "裕群",
    "en": "Joo Koon",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW29",
      "Joo Koon",
      "裕群"
    ],
    "stationCodes": "EW29"
  },
  "EW30": {
    "type": "dot",
    "x": 322.146,
    "y": 1037.15,
    "cn": "卡尔圈",
    "en": "Gul Circle",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW30",
      "Gul Circle",
      "卡尔圈"
    ],
    "stationCodes": "EW30"
  },
  "EW31": {
    "type": "dot",
    "x": 322.146,
    "y": 946.369,
    "cn": "大士弯",
    "en": "Tuas Crescent",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW31",
      "Tuas Crescent",
      "大士弯"
    ],
    "stationCodes": "EW31"
  },
  "EW32": {
    "type": "dot",
    "x": 322.145,
    "y": 855.584,
    "cn": "大士西路",
    "en": "Tuas West Road",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW32",
      "Tuas West Road",
      "大士西路"
    ],
    "stationCodes": "EW32"
  },
  "EW33": {
    "type": "dot",
    "x": 322.145,
    "y": 764.795,
    "cn": "大士连路",
    "en": "Tuas Link",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "EW33",
      "Tuas Link",
      "大士连路"
    ],
    "stationCodes": "EW33"
  },
  "CC2": {
    "type": "dot",
    "x": 1881.94,
    "y": 1618.547,
    "cn": "百胜",
    "en": "Bras Basah",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "CC2",
      "Bras Basah",
      "百胜"
    ],
    "stationCodes": "CC2"
  },
  "CC3": {
    "type": "dot",
    "x": 2028.09,
    "y": 1764.984,
    "cn": "滨海中心",
    "en": "Esplanade",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "CC3",
      "Esplanade",
      "滨海中心"
    ],
    "stationCodes": "CC3"
  },
  "CC4": {
    "type": "tsf",
    "x": 2220.592,
    "y": 1816.723,
    "cn": "宝门廊",
    "en": "Promenade",
    "align": "right",
    "offset": {
      "x": 61.8,
      "y": 0.0
    },
    "aliases": [
      "CC4",
      "DT15",
      "Promenade",
      "宝门廊",
      "DT15 / CC4"
    ],
    "stationCodes": "DT15 / CC4"
  },
  "CC5": {
    "type": "dot",
    "x": 2300.721,
    "y": 1713.086,
    "cn": "尼诰大道",
    "en": "Nicoll Highway",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "CC5",
      "Nicoll Highway",
      "尼诰大道"
    ],
    "stationCodes": "CC5"
  },
  "CC6": {
    "type": "dot",
    "x": 2337.583,
    "y": 1613.525,
    "cn": "体育场",
    "en": "Stadium",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "CC6",
      "Stadium",
      "体育场"
    ],
    "stationCodes": "CC6"
  },
  "CC7": {
    "type": "dot",
    "x": 2360.399,
    "y": 1508.773,
    "cn": "蒙巴登",
    "en": "Mountbatten",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "CC7",
      "Mountbatten",
      "蒙巴登"
    ],
    "stationCodes": "CC7"
  },
  "CC8": {
    "type": "dot",
    "x": 2366.081,
    "y": 1407.999,
    "cn": "达科达",
    "en": "Dakota",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "CC8",
      "Dakota",
      "达科达"
    ],
    "stationCodes": "CC8"
  },
  "CC10": {
    "type": "tsf",
    "x": 2302.538,
    "y": 1135.71,
    "cn": "麦波申",
    "en": "MacPherson",
    "align": "left",
    "offset": {
      "x": -66.28,
      "y": 0.0
    },
    "aliases": [
      "CC10",
      "DT26",
      "MacPherson",
      "麦波申",
      "DT26 / CC10"
    ],
    "stationCodes": "DT26 / CC10"
  },
  "CC11": {
    "type": "dot",
    "x": 2232.996,
    "y": 1019.91,
    "cn": "大成",
    "en": "Tai Seng",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "CC11",
      "Tai Seng",
      "大成"
    ],
    "stationCodes": "CC11"
  },
  "CC12": {
    "type": "dot",
    "x": 2143.192,
    "y": 928.252,
    "cn": "巴特礼",
    "en": "Bartley",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "CC12",
      "Bartley",
      "巴特礼"
    ],
    "stationCodes": "CC12"
  },
  "CC13": {
    "type": "tsf",
    "x": 2009.008,
    "y": 834.767,
    "cn": "实龙岗",
    "en": "Serangoon",
    "align": "right",
    "offset": {
      "x": 66.28,
      "y": 0.0
    },
    "aliases": [
      "CC13",
      "NE12",
      "Serangoon",
      "实龙岗",
      "NE12 / CC13"
    ],
    "stationCodes": "NE12 / CC13"
  },
  "CC14": {
    "type": "dot",
    "x": 1849.887,
    "y": 775.9,
    "cn": "罗弄泉",
    "en": "Lorong Chuan",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -12.3
    },
    "aliases": [
      "CC14",
      "Lorong Chuan",
      "罗弄泉"
    ],
    "stationCodes": "CC14"
  },
  "CC16": {
    "type": "dot",
    "x": 1485.569,
    "y": 794.877,
    "cn": "玛丽蒙",
    "en": "Marymount",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -12.3
    },
    "aliases": [
      "CC16",
      "Marymount",
      "玛丽蒙"
    ],
    "stationCodes": "CC16"
  },
  "CC17": {
    "type": "tsf",
    "x": 1368.846,
    "y": 854.244,
    "cn": "加利谷",
    "en": "Caldecott",
    "align": "left",
    "offset": {
      "x": -61.8,
      "y": 0.0
    },
    "aliases": [
      "CC17",
      "TE9",
      "Caldecott",
      "加利谷",
      "CC17 / TE9"
    ],
    "stationCodes": "CC17 / TE9"
  },
  "CC19": {
    "type": "tsf",
    "x": 1164.18,
    "y": 1035.011,
    "cn": "植物园",
    "en": "Botanic Gardens",
    "align": "bottom-right",
    "offset": {
      "x": -6.261,
      "y": 15.0
    },
    "aliases": [
      "CC19",
      "DT9",
      "Botanic Gardens",
      "植物园",
      "CC19 / DT9"
    ],
    "stationCodes": "CC19 / DT9"
  },
  "CC20": {
    "type": "dot",
    "x": 1093.203,
    "y": 1166.819,
    "cn": "花拉路",
    "en": "Farrer Road",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC20",
      "Farrer Road",
      "花拉路"
    ],
    "stationCodes": "CC20"
  },
  "CC21": {
    "type": "dot",
    "x": 1054.393,
    "y": 1276.907,
    "cn": "荷兰村",
    "en": "Holland Village",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC21",
      "Holland Village",
      "荷兰村"
    ],
    "stationCodes": "CC21"
  },
  "CC23": {
    "type": "dot",
    "x": 1045.344,
    "y": 1513.794,
    "cn": "纬壹",
    "en": "one-north",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC23",
      "one-north",
      "纬壹"
    ],
    "stationCodes": "CC23"
  },
  "CC24": {
    "type": "dot",
    "x": 1067.737,
    "y": 1615.966,
    "cn": "肯特岗",
    "en": "Kent Ridge",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC24",
      "Kent Ridge",
      "肯特岗"
    ],
    "stationCodes": "CC24"
  },
  "CC25": {
    "type": "dot",
    "x": 1100.603,
    "y": 1708.69,
    "cn": "虎豹别墅",
    "en": "Haw Par Villa",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC25",
      "Haw Par Villa",
      "虎豹别墅"
    ],
    "stationCodes": "CC25"
  },
  "CC26": {
    "type": "dot",
    "x": 1146.291,
    "y": 1790.479,
    "cn": "巴西班让",
    "en": "Pasir Panjang",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC26",
      "Pasir Panjang",
      "巴西班让"
    ],
    "stationCodes": "CC26"
  },
  "CC27": {
    "type": "dot",
    "x": 1211.783,
    "y": 1871.416,
    "cn": "拉柏多公园",
    "en": "Labrador Park",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC27",
      "Labrador Park",
      "拉柏多公园"
    ],
    "stationCodes": "CC27"
  },
  "CC28": {
    "type": "dot",
    "x": 1294.755,
    "y": 1946.065,
    "cn": "直落布兰雅",
    "en": "Telok Blangah",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "CC28",
      "Telok Blangah",
      "直落布兰雅"
    ],
    "stationCodes": "CC28"
  },
  "CC29": {
    "type": "tsf",
    "x": 1415.444,
    "y": 2022.705,
    "cn": "港湾",
    "en": "HarbourFront",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 15.8
    },
    "aliases": [
      "CC29",
      "NE1",
      "HarbourFront",
      "港湾",
      "CC29 / NE1"
    ],
    "stationCodes": "CC29 / NE1"
  },
  "CC30": {
    "type": "dot",
    "x": 1549.5,
    "y": 2069.647,
    "cn": "吉宝",
    "en": "Keppel",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "CC30",
      "Keppel",
      "吉宝"
    ],
    "stationCodes": "CC30"
  },
  "CC31": {
    "type": "dot",
    "x": 1658.188,
    "y": 2086.423,
    "cn": "广东民",
    "en": "Cantonment",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "CC31",
      "Cantonment",
      "广东民"
    ],
    "stationCodes": "CC31"
  },
  "CC32": {
    "type": "dot",
    "x": 1772.0,
    "y": 2085.472,
    "cn": "爱德华太子路",
    "en": "Prince Edward Road",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "CC32",
      "Prince Edward Road",
      "爱德华太子路"
    ],
    "stationCodes": "CC32"
  },
  "CC34": {
    "type": "tsf",
    "x": 2086.026,
    "y": 1943.455,
    "cn": "海湾舫",
    "en": "Bayfront",
    "align": "right",
    "offset": {
      "x": 66.28,
      "y": 0.0
    },
    "aliases": [
      "CC34",
      "DT16",
      "Bayfront",
      "海湾舫",
      "DT16 / CC34"
    ],
    "stationCodes": "DT16 / CC34"
  },
  "TE1": {
    "type": "dot",
    "x": 900.213,
    "y": 195.446,
    "cn": "兀兰北",
    "en": "Woodlands North",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "TE1",
      "Woodlands North",
      "兀兰北"
    ],
    "stationCodes": "TE1"
  },
  "TE3": {
    "type": "dot",
    "x": 1059.642,
    "y": 364.889,
    "cn": "兀兰南",
    "en": "Woodlands South",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "TE3",
      "Woodlands South",
      "兀兰南"
    ],
    "stationCodes": "TE3"
  },
  "TE4": {
    "type": "dot",
    "x": 1122.624,
    "y": 430.646,
    "cn": "春叶",
    "en": "Springleaf",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "TE4",
      "Springleaf",
      "春叶"
    ],
    "stationCodes": "TE4"
  },
  "TE5": {
    "type": "dot",
    "x": 1184.592,
    "y": 496.411,
    "cn": "伦多",
    "en": "Lentor",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "TE5",
      "Lentor",
      "伦多"
    ],
    "stationCodes": "TE5"
  },
  "TE6": {
    "type": "dot",
    "x": 1247.536,
    "y": 562.168,
    "cn": "美华",
    "en": "Mayflower",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "TE6",
      "Mayflower",
      "美华"
    ],
    "stationCodes": "TE6"
  },
  "TE7": {
    "type": "dot",
    "x": 1310.605,
    "y": 627.933,
    "cn": "光明山",
    "en": "Bright Hill",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "TE7",
      "Bright Hill",
      "光明山"
    ],
    "stationCodes": "TE7"
  },
  "TE8": {
    "type": "dot",
    "x": 1368.801,
    "y": 746.079,
    "cn": "汤申路上段",
    "en": "Upper Thomson",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "TE8",
      "Upper Thomson",
      "汤申路上段"
    ],
    "stationCodes": "TE8"
  },
  "TE11": {
    "type": "tsf",
    "x": 1368.888,
    "y": 1034.334,
    "cn": "史蒂芬",
    "en": "Stevens",
    "align": "top-left",
    "offset": {
      "x": -7.245,
      "y": -15.0
    },
    "aliases": [
      "TE11",
      "DT10",
      "Stevens",
      "史蒂芬",
      "DT10 / TE11"
    ],
    "stationCodes": "DT10 / TE11"
  },
  "TE12": {
    "type": "dot",
    "x": 1367.848,
    "y": 1128.02,
    "cn": "纳比雅",
    "en": "Napier",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "TE12",
      "Napier",
      "纳比雅"
    ],
    "stationCodes": "TE12"
  },
  "TE13": {
    "type": "dot",
    "x": 1367.848,
    "y": 1208.722,
    "cn": "乌节大道",
    "en": "Orchard Boulevard",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "TE13",
      "Orchard Boulevard",
      "乌节大道"
    ],
    "stationCodes": "TE13"
  },
  "TE15": {
    "type": "dot",
    "x": 1367.848,
    "y": 1386.997,
    "cn": "大世界",
    "en": "Great World",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "TE15",
      "Great World",
      "大世界"
    ],
    "stationCodes": "TE15"
  },
  "TE16": {
    "type": "dot",
    "x": 1369.744,
    "y": 1483.285,
    "cn": "合乐",
    "en": "Havelock",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE16",
      "Havelock",
      "合乐"
    ],
    "stationCodes": "TE16"
  },
  "TE18": {
    "type": "dot",
    "x": 1603.348,
    "y": 1825.07,
    "cn": "麦士威",
    "en": "Maxwell",
    "align": "top-right",
    "offset": {
      "x": -13.503,
      "y": -12.0
    },
    "aliases": [
      "TE18",
      "Maxwell",
      "麦士威"
    ],
    "stationCodes": "TE18"
  },
  "TE19": {
    "type": "dot",
    "x": 1764.586,
    "y": 1979.838,
    "cn": "珊顿道",
    "en": "Shenton Way",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "TE19",
      "Shenton Way",
      "珊顿道"
    ],
    "stationCodes": "TE19"
  },
  "TE22": {
    "type": "dot",
    "x": 2327.597,
    "y": 1935.399,
    "cn": "滨海湾花园",
    "en": "Gardens by the Bay",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE22",
      "Gardens by the Bay",
      "滨海湾花园"
    ],
    "stationCodes": "TE22"
  },
  "TE23": {
    "type": "dot",
    "x": 2488.063,
    "y": 1776.195,
    "cn": "丹戎禺",
    "en": "Tanjong Rhu",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE23",
      "Tanjong Rhu",
      "丹戎禺"
    ],
    "stationCodes": "TE23"
  },
  "TE24": {
    "type": "dot",
    "x": 2551.129,
    "y": 1713.096,
    "cn": "加东公园",
    "en": "Katong Park",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE24",
      "Katong Park",
      "加东公园"
    ],
    "stationCodes": "TE24"
  },
  "TE25": {
    "type": "dot",
    "x": 2614.196,
    "y": 1649.997,
    "cn": "丹戎加东",
    "en": "Tanjong Katong",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE25",
      "Tanjong Katong",
      "丹戎加东"
    ],
    "stationCodes": "TE25"
  },
  "TE26": {
    "type": "dot",
    "x": 2677.263,
    "y": 1586.898,
    "cn": "马林百列",
    "en": "Marine Parade",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE26",
      "Marine Parade",
      "马林百列"
    ],
    "stationCodes": "TE26"
  },
  "TE27": {
    "type": "dot",
    "x": 2740.329,
    "y": 1523.799,
    "cn": "马林台",
    "en": "Marine Terrace",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE27",
      "Marine Terrace",
      "马林台"
    ],
    "stationCodes": "TE27"
  },
  "TE28": {
    "type": "dot",
    "x": 2803.396,
    "y": 1460.7,
    "cn": "实乞纳",
    "en": "Siglap",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE28",
      "Siglap",
      "实乞纳"
    ],
    "stationCodes": "TE28"
  },
  "TE29": {
    "type": "dot",
    "x": 2859.072,
    "y": 1404.992,
    "cn": "碧湾",
    "en": "Bayshore",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE29",
      "Bayshore",
      "碧湾"
    ],
    "stationCodes": "TE29"
  },
  "BP2": {
    "type": "dot",
    "x": 872.231,
    "y": 825.322,
    "cn": "南景",
    "en": "South View",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "BP2",
      "South View",
      "南景"
    ],
    "stationCodes": "BP2"
  },
  "BP3": {
    "type": "dot",
    "x": 872.231,
    "y": 760.32,
    "cn": "吉丰",
    "en": "Keat Hong",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "BP3",
      "Keat Hong",
      "吉丰"
    ],
    "stationCodes": "BP3"
  },
  "BP4": {
    "type": "dot",
    "x": 872.231,
    "y": 697.832,
    "cn": "德惠",
    "en": "Teck Whye",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "BP4",
      "Teck Whye",
      "德惠"
    ],
    "stationCodes": "BP4"
  },
  "BP5": {
    "type": "dot",
    "x": 871.826,
    "y": 632.639,
    "cn": "凤凰",
    "en": "Phoenix",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "BP5",
      "Phoenix",
      "凤凰"
    ],
    "stationCodes": "BP5"
  },
  "BP6": {
    "type": "tsfo",
    "x": 870.03,
    "y": 546.222,
    "cn": "武吉班让",
    "en": "Bukit Panjang",
    "align": "right",
    "offset": {
      "x": 29.16,
      "y": 0.0
    },
    "aliases": [
      "Bukit Panjang",
      "武吉班让",
      "BP6"
    ],
    "physicalHubId": "bukit-panjang",
    "paidAreaTransfer": {
      "peerId": "DT1",
      "peerCode": "DT1",
      "peerLine": "滨海市区线",
      "limitMinutes": 15
    },
    "stationCodes": "BP6"
  },
  "BP7": {
    "type": "dot",
    "x": 912.431,
    "y": 485.694,
    "cn": "柏提",
    "en": "Petir",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "BP7",
      "Petir",
      "柏提"
    ],
    "stationCodes": "BP7"
  },
  "BP8": {
    "type": "dot",
    "x": 936.526,
    "y": 442.738,
    "cn": "秉定",
    "en": "Pending",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "BP8",
      "Pending",
      "秉定"
    ],
    "stationCodes": "BP8"
  },
  "BP9": {
    "type": "dot",
    "x": 923.366,
    "y": 398.524,
    "cn": "万吉",
    "en": "Bangkit",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "BP9",
      "Bangkit",
      "万吉"
    ],
    "stationCodes": "BP9"
  },
  "BP10": {
    "type": "dot",
    "x": 871.829,
    "y": 370.993,
    "cn": "法嘉",
    "en": "Fajar",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -9.3
    },
    "aliases": [
      "BP10",
      "Fajar",
      "法嘉"
    ],
    "stationCodes": "BP10"
  },
  "BP11": {
    "type": "dot",
    "x": 814.645,
    "y": 398.527,
    "cn": "实加",
    "en": "Segar",
    "align": "left",
    "offset": {
      "x": -19.36,
      "y": 0.0
    },
    "aliases": [
      "BP11",
      "Segar",
      "实加"
    ],
    "stationCodes": "BP11"
  },
  "BP12": {
    "type": "dot",
    "x": 805.671,
    "y": 442.738,
    "cn": "泽拉邦",
    "en": "Jelapang",
    "align": "left",
    "offset": {
      "x": -19.36,
      "y": 0.0
    },
    "aliases": [
      "BP12",
      "Jelapang",
      "泽拉邦"
    ],
    "stationCodes": "BP12"
  },
  "BP13": {
    "type": "dot",
    "x": 832.176,
    "y": 485.692,
    "cn": "信佳",
    "en": "Senja",
    "align": "left",
    "offset": {
      "x": -19.36,
      "y": 0.0
    },
    "aliases": [
      "BP13",
      "Senja",
      "信佳"
    ],
    "stationCodes": "BP13"
  },
  "CG1": {
    "type": "tsf",
    "x": 3071.039,
    "y": 1115.972,
    "cn": "博览",
    "en": "Expo",
    "align": "top-left",
    "offset": {
      "x": -6.901,
      "y": -15.0
    },
    "aliases": [
      "CG1",
      "DT35",
      "Expo",
      "博览",
      "CG1 / DT35"
    ],
    "stationCodes": "CG1 / DT35"
  },
  "CG2": {
    "type": "dot",
    "x": 3186.931,
    "y": 1116.142,
    "cn": "樟宜机场",
    "en": "Changi Airport",
    "align": "bottom-right",
    "offset": {
      "x": -39.303,
      "y": 11.5
    },
    "aliases": [
      "CG2",
      "Changi Airport",
      "樟宜机场"
    ],
    "stationCodes": "CG2"
  },
  "NE4": {
    "type": "tsf",
    "x": 1571.467,
    "y": 1677.367,
    "cn": "牛车水",
    "en": "Chinatown",
    "align": "right",
    "offset": {
      "x": 61.8,
      "y": 0.0
    },
    "aliases": [
      "NE4",
      "DT19",
      "Chinatown",
      "牛车水",
      "NE4 / DT19"
    ],
    "stationCodes": "NE4 / DT19"
  },
  "NE5": {
    "type": "dot",
    "x": 1610.85,
    "y": 1629.288,
    "cn": "克拉码头",
    "en": "Clarke Quay",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 4.0
    },
    "aliases": [
      "NE5",
      "Clarke Quay",
      "克拉码头"
    ],
    "stationCodes": "NE5"
  },
  "NE7": {
    "type": "tsf",
    "x": 1765.166,
    "y": 1318.107,
    "cn": "小印度",
    "en": "Little India",
    "align": "right",
    "offset": {
      "x": 61.8,
      "y": 0.0
    },
    "aliases": [
      "NE7",
      "DT12",
      "Little India",
      "小印度",
      "NE7 / DT12"
    ],
    "stationCodes": "NE7 / DT12"
  },
  "NE8": {
    "type": "dot",
    "x": 1760.753,
    "y": 1217.685,
    "cn": "花拉公园",
    "en": "Farrer Park",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "NE8",
      "Farrer Park",
      "花拉公园"
    ],
    "stationCodes": "NE8"
  },
  "NE9": {
    "type": "dot",
    "x": 1760.753,
    "y": 1122.876,
    "cn": "文庆",
    "en": "Boon Keng",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "NE9",
      "Boon Keng",
      "文庆"
    ],
    "stationCodes": "NE9"
  },
  "NE10": {
    "type": "dot",
    "x": 1817.882,
    "y": 1024.824,
    "cn": "波东巴西",
    "en": "Potong Pasir",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NE10",
      "Potong Pasir",
      "波东巴西"
    ],
    "stationCodes": "NE10"
  },
  "NE11": {
    "type": "dot",
    "x": 1908.181,
    "y": 931.876,
    "cn": "兀里",
    "en": "Woodleigh",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NE11",
      "Woodleigh",
      "兀里"
    ],
    "stationCodes": "NE11"
  },
  "NE13": {
    "type": "dot",
    "x": 2085.781,
    "y": 756.503,
    "cn": "高文",
    "en": "Kovan",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NE13",
      "Kovan",
      "高文"
    ],
    "stationCodes": "NE13"
  },
  "NE14": {
    "type": "dot",
    "x": 2153.524,
    "y": 688.478,
    "cn": "后港",
    "en": "Hougang",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "NE14",
      "Hougang",
      "后港"
    ],
    "stationCodes": "NE14"
  },
  "NE15": {
    "type": "dot",
    "x": 2218.296,
    "y": 622.928,
    "cn": "万国",
    "en": "Buangkok",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "NE15",
      "Buangkok",
      "万国"
    ],
    "stationCodes": "NE15"
  },
  "NE16": {
    "type": "tsf",
    "x": 2287.788,
    "y": 555.943,
    "cn": "盛港",
    "en": "Sengkang",
    "align": "left",
    "offset": {
      "x": -66.28,
      "y": 0.0
    },
    "aliases": [
      "NE16",
      "STC",
      "Sengkang",
      "盛港",
      "NE16 / STC"
    ],
    "stationCodes": "NE16 / STC"
  },
  "NE17": {
    "type": "tsf",
    "x": 2441.684,
    "y": 400.767,
    "cn": "榜鹅",
    "en": "Punggol",
    "align": "right",
    "offset": {
      "x": 66.28,
      "y": 0.0
    },
    "aliases": [
      "NE17",
      "PTC",
      "Punggol",
      "榜鹅",
      "NE17 / PTC"
    ],
    "stationCodes": "NE17 / PTC"
  },
  "NE18": {
    "type": "dot",
    "x": 2490.25,
    "y": 345.597,
    "cn": "榜鹅海岸",
    "en": "Punggol Coast",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "NE18",
      "Punggol Coast",
      "榜鹅海岸"
    ],
    "stationCodes": "NE18"
  },
  "DT2": {
    "type": "dot",
    "x": 1013.354,
    "y": 617.818,
    "cn": "凯秀",
    "en": "Cashew",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "DT2",
      "Cashew",
      "凯秀"
    ],
    "stationCodes": "DT2"
  },
  "DT3": {
    "type": "dot",
    "x": 1030.518,
    "y": 682.606,
    "cn": "山景",
    "en": "Hillview",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "DT3",
      "Hillview",
      "山景"
    ],
    "stationCodes": "DT3"
  },
  "DT4": {
    "type": "dot",
    "x": 1030.518,
    "y": 745.237,
    "cn": "谦道",
    "en": "Hume",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "DT4",
      "Hume",
      "谦道"
    ],
    "stationCodes": "DT4"
  },
  "DT5": {
    "type": "dot",
    "x": 1030.518,
    "y": 811.636,
    "cn": "美世界",
    "en": "Beauty World",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "DT5",
      "Beauty World",
      "美世界"
    ],
    "stationCodes": "DT5"
  },
  "DT6": {
    "type": "dot",
    "x": 1030.518,
    "y": 885.23,
    "cn": "阿尔柏王园",
    "en": "King Albert Park",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "DT6",
      "King Albert Park",
      "阿尔柏王园"
    ],
    "stationCodes": "DT6"
  },
  "DT7": {
    "type": "dot",
    "x": 1034.995,
    "y": 951.053,
    "cn": "第六道",
    "en": "Sixth Avenue",
    "align": "right",
    "offset": {
      "x": 23.0,
      "y": 0.0
    },
    "aliases": [
      "DT7",
      "Sixth Avenue",
      "第六道"
    ],
    "stationCodes": "DT7"
  },
  "DT8": {
    "type": "dot",
    "x": 1065.155,
    "y": 1007.857,
    "cn": "陈嘉庚",
    "en": "Tan Kah Kee",
    "align": "left",
    "offset": {
      "x": -23.0,
      "y": 0.0
    },
    "aliases": [
      "DT8",
      "Tan Kah Kee",
      "陈嘉庚"
    ],
    "stationCodes": "DT8"
  },
  "DT13": {
    "type": "dot",
    "x": 1857.573,
    "y": 1412.619,
    "cn": "梧槽",
    "en": "Rochor",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "DT13",
      "Rochor",
      "梧槽"
    ],
    "stationCodes": "DT13"
  },
  "DT17": {
    "type": "dot",
    "x": 1950.752,
    "y": 1978.021,
    "cn": "市中心",
    "en": "Downtown",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -12.3
    },
    "aliases": [
      "DT17",
      "Downtown",
      "市中心"
    ],
    "stationCodes": "DT17"
  },
  "DT18": {
    "type": "dot",
    "x": 1772.706,
    "y": 1867.304,
    "cn": "直落亚逸",
    "en": "Telok Ayer",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "DT18",
      "Telok Ayer",
      "直落亚逸"
    ],
    "stationCodes": "DT18"
  },
  "DT20": {
    "type": "dot",
    "x": 1562.44,
    "y": 1568.648,
    "cn": "福康宁",
    "en": "Fort Canning",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "DT20",
      "Fort Canning",
      "福康宁"
    ],
    "stationCodes": "DT20"
  },
  "DT21": {
    "type": "dot",
    "x": 1911.078,
    "y": 1537.71,
    "cn": "明古连",
    "en": "Bencoolen",
    "align": "top-left",
    "offset": {
      "x": 5.621,
      "y": -11.5
    },
    "aliases": [
      "DT21",
      "Bencoolen",
      "明古连"
    ],
    "stationCodes": "DT21"
  },
  "DT22": {
    "type": "dot",
    "x": 1990.071,
    "y": 1458.336,
    "cn": "惹兰勿刹",
    "en": "Jalan Besar",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "DT22",
      "Jalan Besar",
      "惹兰勿刹"
    ],
    "stationCodes": "DT22"
  },
  "DT23": {
    "type": "dot",
    "x": 2094.435,
    "y": 1354.758,
    "cn": "明地迷亚",
    "en": "Bendemeer",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "DT23",
      "Bendemeer",
      "明地迷亚"
    ],
    "stationCodes": "DT23"
  },
  "DT24": {
    "type": "dot",
    "x": 2161.457,
    "y": 1281.746,
    "cn": "芽笼峇鲁",
    "en": "Geylang Bahru",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "DT24",
      "Geylang Bahru",
      "芽笼峇鲁"
    ],
    "stationCodes": "DT24"
  },
  "DT25": {
    "type": "dot",
    "x": 2234.825,
    "y": 1208.726,
    "cn": "玛达",
    "en": "Mattar",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "DT25",
      "Mattar",
      "玛达"
    ],
    "stationCodes": "DT25"
  },
  "DT27": {
    "type": "dot",
    "x": 2387.838,
    "y": 1056.821,
    "cn": "乌美",
    "en": "Ubi",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "DT27",
      "Ubi",
      "乌美"
    ],
    "stationCodes": "DT27"
  },
  "DT28": {
    "type": "dot",
    "x": 2463.505,
    "y": 976.265,
    "cn": "加基武吉",
    "en": "Kaki Bukit",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "DT28",
      "Kaki Bukit",
      "加基武吉"
    ],
    "stationCodes": "DT28"
  },
  "DT29": {
    "type": "dot",
    "x": 2541.819,
    "y": 904.759,
    "cn": "勿洛北",
    "en": "Bedok North",
    "align": "left",
    "offset": {
      "x": -26.5,
      "y": 0.0
    },
    "aliases": [
      "DT29",
      "Bedok North",
      "勿洛北"
    ],
    "stationCodes": "DT29"
  },
  "DT30": {
    "type": "dot",
    "x": 2673.846,
    "y": 879.313,
    "cn": "勿洛蓄水池",
    "en": "Bedok Reservoir",
    "align": "bottom",
    "offset": {
      "x": 0.0,
      "y": 12.3
    },
    "aliases": [
      "DT30",
      "Bedok Reservoir",
      "勿洛蓄水池"
    ],
    "stationCodes": "DT30"
  },
  "DT31": {
    "type": "dot",
    "x": 2806.071,
    "y": 879.313,
    "cn": "淡滨尼西",
    "en": "Tampines West",
    "align": "top",
    "offset": {
      "x": 0.0,
      "y": -12.3
    },
    "aliases": [
      "DT31",
      "Tampines West",
      "淡滨尼西"
    ],
    "stationCodes": "DT31"
  },
  "DT33": {
    "type": "dot",
    "x": 3071.051,
    "y": 942.092,
    "cn": "淡滨尼东",
    "en": "Tampines East",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "DT33",
      "Tampines East",
      "淡滨尼东"
    ],
    "stationCodes": "DT33"
  },
  "DT34": {
    "type": "dot",
    "x": 3071.051,
    "y": 1012.754,
    "cn": "樟宜上段",
    "en": "Upper Changi",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "DT34",
      "Upper Changi",
      "樟宜上段"
    ],
    "stationCodes": "DT34"
  },
  "SE1": {
    "type": "dot",
    "x": 2427.661,
    "y": 626.742,
    "cn": "康埔桦",
    "en": "Compassvale",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "SE1",
      "Compassvale",
      "康埔桦"
    ],
    "stationCodes": "SE1"
  },
  "SE2": {
    "type": "dot",
    "x": 2467.989,
    "y": 666.614,
    "cn": "棕美",
    "en": "Rumbia",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "SE2",
      "Rumbia",
      "棕美"
    ],
    "stationCodes": "SE2"
  },
  "SE3": {
    "type": "dot",
    "x": 2473.996,
    "y": 734.635,
    "cn": "码高",
    "en": "Bakau",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "SE3",
      "Bakau",
      "码高"
    ],
    "stationCodes": "SE3"
  },
  "SE4": {
    "type": "dot",
    "x": 2396.678,
    "y": 722.544,
    "cn": "港脚",
    "en": "Kangkar",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "SE4",
      "Kangkar",
      "港脚"
    ],
    "stationCodes": "SE4"
  },
  "SE5": {
    "type": "dot",
    "x": 2353.987,
    "y": 682.63,
    "cn": "兰岗",
    "en": "Ranggung",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "SE5",
      "Ranggung",
      "兰岗"
    ],
    "stationCodes": "SE5"
  },
  "SW1": {
    "type": "dot",
    "x": 2241.939,
    "y": 441.507,
    "cn": "振林",
    "en": "Cheng Lim",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "SW1",
      "Cheng Lim",
      "振林"
    ],
    "stationCodes": "SW1"
  },
  "SW2": {
    "type": "dot",
    "x": 2208.113,
    "y": 404.968,
    "cn": "农道",
    "en": "Farmway",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "SW2",
      "Farmway",
      "农道"
    ],
    "stationCodes": "SW2"
  },
  "SW3": {
    "type": "dot",
    "x": 2172.616,
    "y": 370.58,
    "cn": "古邦",
    "en": "Kupang",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "SW3",
      "Kupang",
      "古邦"
    ],
    "stationCodes": "SW3"
  },
  "SW4": {
    "type": "dot",
    "x": 2122.366,
    "y": 362.729,
    "cn": "丹甘",
    "en": "Thanggam",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "SW4",
      "Thanggam",
      "丹甘"
    ],
    "stationCodes": "SW4"
  },
  "SW5": {
    "type": "dot",
    "x": 2088.983,
    "y": 393.701,
    "cn": "芬微",
    "en": "Fernvale",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "SW5",
      "Fernvale",
      "芬微"
    ],
    "stationCodes": "SW5"
  },
  "SW6": {
    "type": "dot",
    "x": 2106.586,
    "y": 435.659,
    "cn": "拉雅",
    "en": "Layar",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "SW6",
      "Layar",
      "拉雅"
    ],
    "stationCodes": "SW6"
  },
  "SW7": {
    "type": "dot",
    "x": 2143.216,
    "y": 470.675,
    "cn": "同港",
    "en": "Tongkang",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "SW7",
      "Tongkang",
      "同港"
    ],
    "stationCodes": "SW7"
  },
  "SW8": {
    "type": "dot",
    "x": 2176.943,
    "y": 503.468,
    "cn": "仁宗",
    "en": "Renjong",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "SW8",
      "Renjong",
      "仁宗"
    ],
    "stationCodes": "SW8"
  },
  "PE1": {
    "type": "dot",
    "x": 2501.227,
    "y": 496.665,
    "cn": "海湾",
    "en": "Cove",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "PE1",
      "Cove",
      "海湾"
    ],
    "stationCodes": "PE1"
  },
  "PE2": {
    "type": "dot",
    "x": 2532.555,
    "y": 533.329,
    "cn": "丽园",
    "en": "Meridian",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "PE2",
      "Meridian",
      "丽园"
    ],
    "stationCodes": "PE2"
  },
  "PE3": {
    "type": "dot",
    "x": 2569.801,
    "y": 570.673,
    "cn": "珊瑚",
    "en": "Coral Edge",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "PE3",
      "Coral Edge",
      "珊瑚"
    ],
    "stationCodes": "PE3"
  },
  "PE4": {
    "type": "dot",
    "x": 2637.996,
    "y": 570.682,
    "cn": "里维拉",
    "en": "Riviera",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "PE4",
      "Riviera",
      "里维拉"
    ],
    "stationCodes": "PE4"
  },
  "PE5": {
    "type": "dot",
    "x": 2644.929,
    "y": 511.337,
    "cn": "卡达罗",
    "en": "Kadaloor",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "PE5",
      "Kadaloor",
      "卡达罗"
    ],
    "stationCodes": "PE5"
  },
  "PE6": {
    "type": "dot",
    "x": 2607.659,
    "y": 474.884,
    "cn": "绿洲",
    "en": "Oasis",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "PE6",
      "Oasis",
      "绿洲"
    ],
    "stationCodes": "PE6"
  },
  "PE7": {
    "type": "dot",
    "x": 2565.536,
    "y": 438.595,
    "cn": "达迈",
    "en": "Damai",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "PE7",
      "Damai",
      "达迈"
    ],
    "stationCodes": "PE7"
  },
  "PW1": {
    "type": "dot",
    "x": 2404.958,
    "y": 280.636,
    "cn": "三记",
    "en": "Sam Kee",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": 0.0
    },
    "aliases": [
      "PW1",
      "Sam Kee",
      "三记"
    ],
    "stationCodes": "PW1"
  },
  "PW2": {
    "type": "dot",
    "x": 2374.602,
    "y": 244.069,
    "cn": "德利",
    "en": "Teck Lee",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": -0.0
    },
    "aliases": [
      "PW2",
      "Teck Lee",
      "德利"
    ],
    "stationCodes": "PW2"
  },
  "PW3": {
    "type": "dot",
    "x": 2338.584,
    "y": 207.739,
    "cn": "榜鹅坊",
    "en": "Punggol Point",
    "align": "right",
    "offset": {
      "x": 16.84,
      "y": -0.0
    },
    "aliases": [
      "PW3",
      "Punggol Point",
      "榜鹅坊"
    ],
    "stationCodes": "PW3"
  },
  "PW4": {
    "type": "dot",
    "x": 2270.477,
    "y": 208.972,
    "cn": "山姆",
    "en": "Samudera",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "PW4",
      "Samudera",
      "山姆"
    ],
    "stationCodes": "PW4"
  },
  "PW5": {
    "type": "dot",
    "x": 2261.053,
    "y": 263.046,
    "cn": "尼蒙",
    "en": "Nibong",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "PW5",
      "Nibong",
      "尼蒙"
    ],
    "stationCodes": "PW5"
  },
  "PW6": {
    "type": "dot",
    "x": 2298.182,
    "y": 299.678,
    "cn": "苏芒",
    "en": "Sumang",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "PW6",
      "Sumang",
      "苏芒"
    ],
    "stationCodes": "PW6"
  },
  "PW7": {
    "type": "dot",
    "x": 2337.266,
    "y": 336.048,
    "cn": "树德",
    "en": "Soo Teck",
    "align": "left",
    "offset": {
      "x": -16.84,
      "y": 0.0
    },
    "aliases": [
      "PW7",
      "Soo Teck",
      "树德"
    ],
    "stationCodes": "PW7"
  },
  "DT11": {
    "type": "tsfo",
    "x": 1585.052,
    "y": 1136.877,
    "cn": "纽顿",
    "en": "Newton",
    "align": "right",
    "offset": {
      "x": -75.91,
      "y": 26.88
    },
    "aliases": [
      "Newton",
      "DT11",
      "纽顿"
    ],
    "physicalHubId": "newton",
    "paidAreaTransfer": {
      "peerId": "NS21",
      "peerCode": "NS21",
      "peerLine": "南北线",
      "limitMinutes": 15
    },
    "hideLabel": true,
    "stationCodes": "DT11"
  },
  "DT1": {
    "type": "tsfo",
    "x": 930.472,
    "y": 585.013,
    "cn": "武吉班让",
    "en": "Bukit Panjang",
    "align": "right",
    "offset": {
      "x": -12.25,
      "y": -51.3
    },
    "aliases": [
      "Bukit Panjang",
      "武吉班让",
      "DT1"
    ],
    "physicalHubId": "bukit-panjang",
    "paidAreaTransfer": {
      "peerId": "BP6",
      "peerCode": "BP6",
      "peerLine": "武吉班让轻轨线",
      "limitMinutes": 15
    },
    "hideLabel": true,
    "stationCodes": "DT1"
  },
  "DT32": {
    "type": "tsfo",
    "x": 2984.121,
    "y": 880.442,
    "cn": "淡滨尼",
    "en": "Tampines",
    "align": "right",
    "offset": {
      "x": -16.46,
      "y": -52.08
    },
    "aliases": [
      "Tampines",
      "淡滨尼",
      "DT32"
    ],
    "physicalHubId": "tampines",
    "paidAreaTransfer": {
      "peerId": "EW2",
      "peerCode": "EW2",
      "peerLine": "东西线",
      "limitMinutes": 15
    },
    "hideLabel": true,
    "stationCodes": "DT32"
  },
  "TE30": {
    "type": "no",
    "x": 2918.133,
    "y": 1345.899,
    "cn": "勿洛南",
    "en": "Bedok South",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "TE30",
      "勿洛南",
      "Bedok South"
    ],
    "construction": {
      "project": "汤东线第五阶段",
      "plannedOpening": "2026-12-26"
    },
    "stationCodes": "TE30"
  },
  "TE31": {
    "type": "no",
    "x": 2994.223,
    "y": 1269.643,
    "cn": "双溪勿洛",
    "en": "Sungei Bedok",
    "align": "bottom-right",
    "offset": {
      "x": -7.1,
      "y": 15.0
    },
    "aliases": [
      "TE31",
      "DT37",
      "双溪勿洛",
      "Sungei Bedok",
      "TE31 / DT37"
    ],
    "construction": {
      "project": "汤东线第五阶段及滨海市区线延长段",
      "plannedOpening": "2026-12-26"
    },
    "stationCodes": "TE31 / DT37"
  },
  "DT36": {
    "type": "no",
    "x": 3055.292,
    "y": 1208.677,
    "cn": "锡林",
    "en": "Xilin",
    "align": "right",
    "offset": {
      "x": 26.5,
      "y": 0.0
    },
    "aliases": [
      "DT36",
      "锡林",
      "Xilin"
    ],
    "construction": {
      "project": "滨海市区线延长段",
      "plannedOpening": "2026-12-26"
    },
    "stationCodes": "DT36"
  },
  "SENTOSA_VIVO": {
    "type": "dot",
    "x": 1420,
    "y": 2108,
    "cn": "怡丰城",
    "en": "VivoCity",
    "stationCodes": "",
    "transportLabel": "圣淘沙捷运",
    "sentosaExpress": true,
    "align": "right",
    "offset": {
      "x": 18.0,
      "y": 0
    },
    "aliases": [
      "怡丰城",
      "VivoCity",
      "圣淘沙",
      "Sentosa Express",
      "VivoCity Station"
    ]
  },
  "SENTOSA_RWS": {
    "type": "dot",
    "x": 1420,
    "y": 2240,
    "cn": "名胜世界",
    "en": "Resorts World",
    "stationCodes": "",
    "transportLabel": "圣淘沙捷运",
    "sentosaExpress": true,
    "align": "right",
    "offset": {
      "x": 18.0,
      "y": 0
    },
    "aliases": [
      "名胜世界",
      "Resorts World",
      "圣淘沙",
      "Sentosa Express",
      "Resorts World Station"
    ]
  },
  "SENTOSA_IMBIAH": {
    "type": "dot",
    "x": 1380,
    "y": 2280,
    "cn": "英比奥",
    "en": "Imbiah",
    "stationCodes": "",
    "transportLabel": "圣淘沙捷运",
    "sentosaExpress": true,
    "align": "right",
    "offset": {
      "x": 18.0,
      "y": 0
    },
    "aliases": [
      "英比奥",
      "Imbiah",
      "圣淘沙",
      "Sentosa Express",
      "Imbiah Station"
    ]
  },
  "SENTOSA_BEACH": {
    "type": "dot",
    "x": 1340,
    "y": 2320,
    "cn": "海滩",
    "en": "Beach",
    "stationCodes": "",
    "transportLabel": "圣淘沙捷运",
    "sentosaExpress": true,
    "align": "right",
    "offset": {
      "x": 18.0,
      "y": 0
    },
    "aliases": [
      "海滩",
      "Beach",
      "圣淘沙",
      "Sentosa Express",
      "Beach Station"
    ]
  }
};
