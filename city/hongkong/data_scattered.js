/**
 * CGo OpenMap - 香港示意圖裝飾層 (city/hongkong/data_scattered.js)
 *
 * hongkong_deco.svg 為綫路圖的「靜態家具」圖層：海域與陸地輪廓、深圳地鐵灰色綫網、
 * 馬場站賽馬日虛綫支綫、付費區 / 閘外換乘連接綫、圖標方塊與圖例框。
 * 圖標方塊內的圖形取自 CGoUI 內置通用圖標（plane / tram / tourist / crh），不含任何商標。
 *
 * HK_DECO_TEXT 為區域名稱、圖例文字與註記的墨跡包圍盒，由 hongkong.js 以開源字體排版，
 * 不嵌入任何原圖字形輪廓。
 */

const SCATTERED_DATA = [
    {
        id: "hongkong-deco",
        file: "./city/hongkong/assets/hongkong_deco.svg",
        x: 1027,
        y: 619,
        width: 2055,
        height: 1238,
        opacity: 1,
        zIndex: 4
    }
];

const HK_DECO_TEXT = [
 {
  "cls": "region",
  "cn": "深圳",
  "en": "Shenzhen",
  "bcn": [
   415.65,
   50.01,
   479.95,
   76.07
  ],
  "ben": [
   408.13,
   80.63,
   487.12,
   94.53
  ],
  "ta": "center"
 },
 {
  "cls": "region",
  "cn": "新界",
  "en": "New Territories",
  "bcn": [
   907.78,
   247.39,
   972.65,
   273.92
  ],
  "ben": [
   879.08,
   278.55,
   1001.98,
   292.3
  ],
  "ta": "center"
 },
 {
  "cls": "region",
  "cn": "九龍",
  "en": "Kowloon",
  "bcn": [
   1304.81,
   540.79,
   1369.54,
   567.2
  ],
  "ben": [
   1302.21,
   571.96,
   1372.33,
   585.88
  ],
  "ta": "center"
 },
 {
  "cls": "region",
  "cn": "大嶼山",
  "en": "Lantau Island",
  "bcn": [
   180.59,
   823.32,
   263.77,
   849.66
  ],
  "ben": [
   169.03,
   854.2,
   276.15,
   868.11
  ],
  "ta": "center"
 },
 {
  "cls": "region",
  "cn": "港島",
  "en": "Hong Kong Island",
  "bcn": [
   1329.39,
   1038.08,
   1393.52,
   1064.26
  ],
  "ben": [
   1290.44,
   1069.13,
   1432.98,
   1086.87
  ],
  "ta": "center"
 },
 {
  "cls": "legend",
  "cn": "機場快綫",
  "en": "Airport Express",
  "bcn": [
   137.37,
   978.3,
   174.38,
   987.08
  ],
  "ben": [
   137.15,
   988.59,
   190.31,
   996.06
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "迪士尼綫",
  "en": "Disneyland Resort Line",
  "bcn": [
   137.3,
   1003.51,
   174.47,
   1012.16
  ],
  "ben": [
   137.16,
   1013.7,
   216.58,
   1021.43
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "東鐵綫",
  "en": "East Rail Line",
  "bcn": [
   136.87,
   1028.79,
   164.53,
   1037.54
  ],
  "ben": [
   137.16,
   1038.99,
   182.06,
   1044.98
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "港島綫",
  "en": "Island Line",
  "bcn": [
   137.02,
   1054.11,
   164.53,
   1062.72
  ],
  "ben": [
   137.16,
   1064.29,
   174.03,
   1070.28
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "觀塘綫",
  "en": "Kwun Tong Line",
  "bcn": [
   136.89,
   1079.52,
   164.53,
   1088.18
  ],
  "ben": [
   137.16,
   1089.77,
   192.83,
   1097.33
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "南港島綫",
  "en": "South Island Line",
  "bcn": [
   137.22,
   1105.04,
   174.15,
   1113.73
  ],
  "ben": [
   137.07,
   1115.22,
   196.79,
   1121.2
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "將軍澳綫",
  "en": "Tseung Kwan O Line",
  "bcn": [
   137.17,
   1130.38,
   174.2,
   1139.16
  ],
  "ben": [
   136.85,
   1140.64,
   207.56,
   1148.21
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "荃灣綫",
  "en": "Tsuen Wan Line",
  "bcn": [
   137.61,
   1155.72,
   165.09,
   1164.37
  ],
  "ben": [
   137.19,
   1165.97,
   192.11,
   1171.89
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "屯馬綫",
  "en": "Tuen Ma Line",
  "bcn": [
   137.47,
   1180.89,
   165.03,
   1189.57
  ],
  "ben": [
   137.13,
   1191.16,
   183.67,
   1197.08
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "東涌綫",
  "en": "Tung Chung Line",
  "bcn": [
   265.58,
   978.33,
   293.25,
   987.06
  ],
  "ben": [
   265.36,
   988.52,
   324.82,
   996.14
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "輕鐵",
  "en": "Light Rail",
  "bcn": [
   265.29,
   1003.47,
   283.29,
   1012.17
  ],
  "ben": [
   265.37,
   1013.68,
   297.08,
   1021.31
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "高速鐵路",
  "en": "High Speed Rail",
  "bcn": [
   265.13,
   1028.81,
   302.05,
   1037.51
  ],
  "ben": [
   265.3,
   1039.02,
   319.36,
   1046.64
  ],
  "ta": "left"
 },
 {
  "cls": "legend",
  "cn": "深圳地鐵網絡",
  "en": "Shenzhen Metro Network",
  "bcn": [
   265.52,
   1054.13,
   321.37,
   1062.86
  ],
  "ben": [
   265.4,
   1064.34,
   354.87,
   1070.32
  ],
  "ta": "left"
 },
 {
  "cls": "legend legend-s",
  "cn": "已付車費區域",
  "en": "Paid area",
  "bcn": [
   265.67,
   1107.15,
   315.83,
   1115.08
  ],
  "ben": [
   265.4,
   1116.36,
   290.89,
   1121.21
  ],
  "ta": "left"
 },
 {
  "cls": "legend legend-s",
  "cn": "閘外區域",
  "en": "Unpaid area",
  "bcn": [
   265.31,
   1132.49,
   298.39,
   1140.39
  ],
  "ben": [
   265.35,
   1141.69,
   299.17,
   1147.81
  ],
  "ta": "left"
 },
 {
  "cls": "legend legend-s",
  "cn": "轉綫站",
  "en": "Interchange",
  "bcn": [
   265.35,
   1157.81,
   291.09,
   1165.69
  ],
  "ben": [
   265.42,
   1167.02,
   299.32,
   1173.2
  ],
  "ta": "left"
 },
 {
  "cls": "legend legend-s",
  "cn": "只限賽馬日",
  "en": "Race days only",
  "bcn": [
   265.26,
   1182.95,
   306.24,
   1190.87
  ],
  "ben": [
   265.36,
   1192.18,
   306.68,
   1198.45
  ],
  "ta": "left"
 },
 {
  "cls": "star",
  "one": "*",
  "b": [
   250.32,
   1186.13,
   258.2,
   1194.02
  ]
 },
 {
  "cls": "star",
  "one": "*",
  "b": [
   1271.22,
   181.57,
   1279.59,
   189.95
  ]
 },
 {
  "cls": "np360",
  "cn": "昂坪",
  "en": "Ngong Ping 360",
  "bcn": [
   315.34,
   822.1,
   331.73,
   829.83
  ],
  "ben": [
   335.56,
   823.17,
   391.1,
   830.74
  ],
  "inline": true
 }
];

if (typeof window !== "undefined") window.HK_DECO_TEXT = HK_DECO_TEXT;
