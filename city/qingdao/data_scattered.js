/**
 * CGo OpenMap - 青岛散点元素
 * 交通图标使用用户提供的自定义 SVG。
 */
const SCATTERED_DATA = [
    {
        id: "qingdao-sea",
        file: "./city/qingdao/assets/qingdao_sea.svg",
        x: 1350,
        y: 1125,
        width: 2700,
        height: 2250,
        opacity: 1,
        zIndex: 1
    },
    {
        id: "compass",
        file: "./city/qingdao/assets/compass.svg",
        x: 162,
        y: 85.5,
        width: 90,
        height: 90,
        opacity: 1,
        zIndex: 5
    },
    {
        id: "railway-qingdao",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 1140.2,
        y: 1325.8,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-qingdao-north",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 1451.8,
        y: 780.45,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-hongdao",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 912.75,
        y: 482.25,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-jiaozhou-north",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 819.9,
        y: 198,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-dongjiakou",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 264.75,
        y: 2063,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "airport-jiaodong",
        file: "./city/qingdao/assets/Aircraft.svg",
        x: 819.9,
        y: 288,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-jiaodong-airport",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 797.1,
        y: 288,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-liaoyang-east",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 1758.25,
        y: 999,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-xianjiazhai",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 1574.1,
        y: 504,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-xiaocunzhuang",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 1359.9,
        y: 1080,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-taihangshan",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 945,
        y: 1637.1,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-fenghuangshan",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 459,
        y: 1709.1,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "ship-cruise-terminal",
        file: "./city/qingdao/assets/Ship.svg",
        x: 1166.25,
        y: 1211.25,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "streetcar-agricultural-university",
        file: "./city/qingdao/assets/Streetcar.svg",
        x: 1589.25,
        y: 302.25,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    }
    ];

// Map line badge positions and on-map display height (SVG internal proportions are renderer-owned).
const QINGDAO_MAP_LINE_BADGE_CONFIG = {
    defaultHeight: 31.5,
    placements: [
        // 数字线路：原则上两端都放；7 南（QDM07S）按需求只保留一个。
        // 位移单位按视觉口径微调：1 个色块≈21px，半个色块≈10.5px，一行英文高度≈7.5px。
        { lineId: "QDM01", at: "start", dx: -21,    dy: -21 },
        { lineId: "QDM01", at: "end",   dx: -21,    dy:  21.5 },
        { lineId: "QDM02", at: "start", dx: -36.75, dy: -37.5 },
        { lineId: "QDM02", at: "end",   dx: -35.75, dy:  10.5 },
        { lineId: "QDM03", at: "start", dx:  35,    dy: -42 },
        { lineId: "QDM03", at: "end",   dx: -42,    dy: -26.5 },
        { lineId: "QDM04", at: "start", dx:   0,    dy:  41.5 },
        { lineId: "QDM04", at: "end",   dx:   0,    dy: -34 },
        { lineId: "QDM05", at: "start", dx:  21,    dy:  41.5 },
        { lineId: "QDM05", at: "end",   dx:   0,    dy: -34 },
        { lineId: "QDM06", at: "start", dx:  -8,    dy: -42 },
        { lineId: "QDM06", at: "end",   dx: -34,    dy:  20 },
        { lineId: "QDM07N", at: "start", dx:   0,   dy:  34 },
        { lineId: "QDM07S", at: "start", dx:  44.5, dy:  21 },
        { lineId: "QDM08", at: "start", dx:   0,    dy: -42 },
        { lineId: "QDM08", at: "end",   dx:   0,    dy:  44.5 },
        { lineId: "QDM08B", at: "end",  dx: -34,    dy:   0, displayNumber: "8" },
        { lineId: "QDM09", at: "start", dx:   0,    dy:  52 },
        { lineId: "QDM09", at: "end",   dx:   0,    dy: -34 },
        { lineId: "QDM15", at: "start", dx:   0,    dy: -34 },
        { lineId: "QDM15", at: "end",   dx:  64.65, dy: -42 },
        // 快线两端也放，直接复用原本线路徽标。
        { lineId: "QDM11", at: "start", dx:  92.4,  dy:   0 },
        { lineId: "QDM11", at: "end",   dx: -56.7,  dy:  34 },
        { lineId: "QDM13", at: "start", dx:   0,    dy: -34 },
        { lineId: "QDM13", at: "end",   dx: -34,    dy:  21 }
    ]
};

if (typeof window !== 'undefined') {
    window.SCATTERED_DATA = SCATTERED_DATA;
    window.QINGDAO_MAP_LINE_BADGE_CONFIG = QINGDAO_MAP_LINE_BADGE_CONFIG;
}
