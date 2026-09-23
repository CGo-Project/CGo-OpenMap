/**
 * CGo OpenMap - 福州车站空间示意图与出入口 (city/fuzhou/data_site_space.js)
 *
 * 数据源：福州地铁官网「站点查询」(https://www.fzmtr.com/services/siteQuery?lineName=&stationName=)，
 * 于 2026-09-23 抓取；各站数据在官网的最后更新时间见 updatedAt 字段。
 *
 * 结构：FUZHOU_SITE_SPACE_DATA[车站ID] = { cn, map, sourceLine, lines, exits, updatedAt }
 *   —— 车站空间示意图是**车站级**资料，因此按车站存放，车站卡片在「车站信息」栏目下展示一次。
 *
 * 关于换乘站：官网对同一座换乘站在各条线路上分别登记了一个 map 地址，但图片内容相同 ——
 * 2026-09-23 逐张下载比对，13 座换乘站中 12 座各线图片字节完全一致，洪塘为同一张图的
 * JPEG / WebP 两种编码（4 号线 3938×2030 JPEG，5 号线 8000×4126 WebP），并非两张不同的图。
 * 因此这里每站只保留一份：取体积最小的那张（加载最快），用 sourceLine 记下它来自哪条线路，
 * lines 记下该站所属的全部线路。
 *
 * 图片是官网 CDN 外链（单张 0.3~3.5 MB，共 102 张），不随仓库分发，需联网加载；
 * 出入口为实体设施，优先取该站有登记的那条线路（exitsLine 记录来源线路）。
 */

const FUZHOU_SITE_SPACE_DATA = {
    "M101": {
        cn: "象峰",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/755002534559813.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "C出入口：秀峰路西侧",
            "D出入口：秀峰路西侧",
            "E1出入口：秀峰路西侧",
            "E2出入口：秀峰路东侧",
            "F出入口：秀峰路东侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:12:11"
    },
    "M102": {
        cn: "秀山",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2026/01/16/763560058695749.png",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "B出入口:秀峰路北侧",
            "C出入口:秀峰路北侧",
            "D出入口:秀峰路南侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:12:20"
    },
    "M103": {
        cn: "罗汉山",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421538378770000/desigDrawing/03罗汉山.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A1出入口:厦坊路北侧",
            "A2出入口(预留):厦坊路北侧",
            "A3出入口:厦坊路南侧",
            "B出入口:厦坊路南侧",
            "C1出入口:厦坊路北侧",
            "C2出入口:厦坊路南侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:12:31"
    },
    "M104": {
        cn: "福州火车站",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754976509575237.jpg",
        sourceLine: "M1",
        lines: ["M1", "M6"],
        exits: [
            "A2出入口:火车站南广场",
            "D2出入口:站前路南侧",
            "E出入口:火车站南广场"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:12:44"
    },
    "M105": {
        cn: "斗门",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421538533050000/desigDrawing/05斗门.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:华林路北侧",
            "B出入口:华林路北侧",
            "C出入口:华林路南侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:12:51"
    },
    "M106": {
        cn: "树兜",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421538603080000/desigDrawing/06树兜.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:华林路北侧",
            "B出入口:五四路西侧",
            "C出入口:华林路南侧",
            "D出入口:五四路东侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:13:00"
    },
    "M107": {
        cn: "屏山",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421538672530000/desigDrawing/07屏山.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "B出入口:鼓屏路西侧",
            "D出入口:鼓屏路东侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:13:06"
    },
    "M108": {
        cn: "东街口",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754978513014853.jpg",
        sourceLine: "M1",
        lines: ["M1", "M3"],
        exits: [
            "A出入口:八一七北路与杨桥路交叉口东北侧",
            "B出入口:八一七北路与杨桥路交叉口西北侧",
            "C出入口:八一七北路与杨桥路交叉口西南侧",
            "D出入口:八一七北路与杨桥路交叉口东南侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:13:12"
    },
    "M109": {
        cn: "南门兜",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754978586701893.jpg",
        sourceLine: "M1",
        lines: ["M1", "M2"],
        exits: [
            "A出入口:八一七北路与道山路交叉口西南侧",
            "B出入口:冠亚广场东侧",
            "C出入口:接入冠亚广场侧",
            "D2出入口:八一七北路与乌山路交叉口西南侧",
            "E出入口:八一七北路与古田路交叉口东北侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:13:18"
    },
    "M110": {
        cn: "茶亭",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421538895840000/desigDrawing/10茶亭.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:群众路与八一七路交叉口东北角",
            "B出入口:群众路与八一七路交叉口东南角",
            "C出入口:群众路与八一七路交叉口西南角",
            "D出入口:群众路与八一七路交叉口西北角"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:13:25"
    },
    "M111": {
        cn: "达道",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421538962120000/desigDrawing/11达道.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:广达路与达道路交叉口北侧",
            "C出入口:达道路与广达路交叉口南侧",
            "D出入口:达道路与广达路交叉口东南侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:13:32"
    },
    "M112": {
        cn: "上藤",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539047970000/desigDrawing/12上藤.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:中藤路北侧",
            "B出入口:中藤路西侧",
            "C出入口:中藤路南侧",
            "D出入口:为与东北地块附属用房的连通口"
        ],
        exitsLine: "M1",
        updatedAt: "2026-08-28 17:58:57"
    },
    "M113": {
        cn: "三叉街",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539120640000/desigDrawing/13三叉街.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:六一南路以东、三高路以北",
            "B出入口:六一南路以西、南台大道以东、上三路以北",
            "C出入口:则徐大道以西、南台大道以东、上三路以南",
            "D1出入口:则徐大道以东、三高路以南",
            "出入口位置",
            "A出入口",
            "六一南路以东、三高路以北",
            "B出入口",
            "六一南路以西、南台大道以东、上三路以北",
            "C出入口",
            "则徐大道以西、南台大道以东、上三路以南",
            "D1出入口",
            "则徐大道以东、三高路以南"
        ],
        exitsLine: "M1",
        updatedAt: "2026-08-28 17:59:24"
    },
    "M114": {
        cn: "白湖亭",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539180800000/desigDrawing/14白湖亭.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:则徐大道以东、连江南路以西",
            "B出入口:则徐大道以西、盖山路以北",
            "C出入口:则徐大道以西、盖山路以南",
            "D出入口:则徐大道以东、连江南路以西"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:13:53"
    },
    "M115": {
        cn: "葫芦阵",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539262030000/desigDrawing/15葫芦阵.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:则徐大道以东、高旺路以北",
            "B出入口:则徐大道以西、南二环路以南",
            "C出入口:则徐大道以东、高旺路以南、潘墩路以北"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:14:00"
    },
    "M116": {
        cn: "黄山",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539331090000/desigDrawing/16黄山.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:潘墩路南侧、福峡路东侧",
            "B出入口:叶厦路南侧、福峡路西侧",
            "C出入口:九江路北侧、福峡路东侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:14:08"
    },
    "M117": {
        cn: "排下",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539421880000/desigDrawing/17排下.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:南三环路以北、福峡路以西",
            "B出入口:南三环路以北、福峡路以西",
            "C出入口:南三环路以北、福峡路以东"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:14:14"
    },
    "M118": {
        cn: "城门",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754979192893509.jpg",
        sourceLine: "M1",
        lines: ["M1", "M3"],
        exits: [
            "A出入口（预留):南三环路南侧、福峡路东侧",
            "B出入口:南三环路南侧、福峡路西侧",
            "C出入口:南三环路南侧、福峡路西侧",
            "D出入口:南三环路南侧、福峡路东侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:14:20"
    },
    "M119": {
        cn: "三角埕",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539569870000/desigDrawing/19三角埕.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A出入口:福峡路北侧",
            "B出口（预留）:福峡路南侧",
            "C出入口:福峡路南侧",
            "D出入口:福峡路北侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:14:26"
    },
    "M120": {
        cn: "胪雷",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/910421539646960000/desigDrawing/20胪雷.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [
            "A1出入口:永南路南侧、福峡路东侧",
            "A2出入口:永南路南侧、福峡路东侧",
            "A3出入口:永南路南侧、福峡路东侧",
            "B出入口:永南路南侧、福峡路东侧",
            "C出入口:永南路南侧、福峡路东侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:14:32"
    },
    "M121": {
        cn: "福州火车南站",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754979399761989.jpg",
        sourceLine: "M1",
        lines: ["M1", "M4"],
        exits: [
            "A1出入口:永南路南侧、胪雷路东侧",
            "A2出入口:永南路南侧、胪雷路东侧",
            "B出入口:永南路南侧、胪雷路东侧",
            "C出入口:永南路南侧、胪雷路东侧",
            "D1出入口:永南路南侧、胪雷路东侧",
            "D2出入口:永南路南侧、胪雷路东侧",
            "E:永南路南侧、胪雷路东侧",
            "F:永南路南侧、胪雷路东侧"
        ],
        exitsLine: "M1",
        updatedAt: "2026-09-11 18:14:38"
    },
    "M122": {
        cn: "安平",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/10514679746290000/desigDrawing/22安平.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [],
        updatedAt: "2026-09-11 18:14:46"
    },
    "M123": {
        cn: "梁厝",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754969767141445.jpg",
        sourceLine: "M1",
        lines: ["M1", "M5"],
        exits: [],
        updatedAt: "2026-09-11 18:14:52"
    },
    "M124": {
        cn: "下洋",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754970611474501.jpg",
        sourceLine: "M1",
        lines: ["M1", "M5"],
        exits: [],
        updatedAt: "2026-09-11 18:14:57"
    },
    "M125": {
        cn: "三江口",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/10514680893110000/desigDrawing/25三江口.jpg",
        sourceLine: "M1",
        lines: ["M1"],
        exits: [],
        updatedAt: "2026-09-11 18:15:03"
    },
    "M201": {
        cn: "苏洋",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754982947168325.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [
            "进出口信息"
        ],
        exitsLine: "M2",
        updatedAt: "2026-09-11 18:16:16"
    },
    "M202": {
        cn: "沙堤",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754982871543877.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:16:22"
    },
    "M203": {
        cn: "上街",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439660093920000/desigDrawing/03上街.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:16:29"
    },
    "M204": {
        cn: "金屿",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439660041070000/desigDrawing/04金屿.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:16:34"
    },
    "M205": {
        cn: "福州大学",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659995960000/desigDrawing/05福大.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:16:40"
    },
    "M206": {
        cn: "董屿·福建师大",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659955850000/desigDrawing/06董屿.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:16:47"
    },
    "M207": {
        cn: "厚庭",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659890380000/desigDrawing/07厚庭.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:16:54"
    },
    "M208": {
        cn: "桔园洲",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659779780000/desigDrawing/08%E6%A1%94%E5%9B%AD%E6%B4%B2-%E6%94%B9.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:17:01"
    },
    "M209": {
        cn: "洪湾",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659700240000/desigDrawing/09洪湾-改.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:17:08"
    },
    "M210": {
        cn: "金山",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754981436452933.jpg",
        sourceLine: "M2",
        lines: ["M2", "M4"],
        exits: [],
        updatedAt: "2026-08-28 18:11:48"
    },
    "M211": {
        cn: "金祥",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659377410000/desigDrawing/11金祥.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-08-28 18:12:18"
    },
    "M212": {
        cn: "祥坂",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659322270000/desigDrawing/12-祥坂-改.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-08-28 18:12:46"
    },
    "M213": {
        cn: "宁化",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439659209720000/desigDrawing/13-宁化-改.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:17:22"
    },
    "M214": {
        cn: "西洋",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439657409470000/desigDrawing/14西洋-改.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:17:33"
    },
    "M216": {
        cn: "水部",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754981033668677.png",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:17:50"
    },
    "M217": {
        cn: "紫阳",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439657195300000/desigDrawing/17紫阳-改.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:17:57"
    },
    "M218": {
        cn: "五里亭",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439657129570000/desigDrawing/18五里亭-改.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:18:05"
    },
    "M219": {
        cn: "前屿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754980820357189.jpg",
        sourceLine: "M2",
        lines: ["M2", "M3"],
        exits: [],
        updatedAt: "2026-09-11 18:18:12"
    },
    "M220": {
        cn: "上洋",
        map: "https://www.fzmtr.com/fzmtrstorage/metroSite/920439656471170000/desigDrawing/20上洋.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:18:20"
    },
    "M221": {
        cn: "鼓山",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754979649343557.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:18:28"
    },
    "M222": {
        cn: "洋里",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754983214907461.jpg",
        sourceLine: "M2",
        lines: ["M2"],
        exits: [],
        updatedAt: "2026-09-11 18:18:35"
    },
    "M401": {
        cn: "半洲",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/24/755193819586629.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:18:52"
    },
    "M402": {
        cn: "建新",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/24/755193870151749.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:18:59"
    },
    "M403": {
        cn: "洪塘",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/24/755193974042693.jpg",
        sourceLine: "M3",
        lines: ["M3", "M4"],
        exits: [],
        updatedAt: "2026-09-11 18:19:06"
    },
    "M404": {
        cn: "金牛山",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/24/755194077859909.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:19:13"
    },
    "M405": {
        cn: "凤凰池",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754974790008901.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:19:19"
    },
    "M406": {
        cn: "陆庄",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754974857121861.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:19:25"
    },
    "M407": {
        cn: "西门",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754974924476485.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:19:30"
    },
    "M409": {
        cn: "省立医院",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975112396869.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:19:42"
    },
    "M410": {
        cn: "东门",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975171870789.jpg",
        sourceLine: "M3",
        lines: ["M3", "M6"],
        exits: [],
        updatedAt: "2026-09-11 18:19:48"
    },
    "M411": {
        cn: "三角池",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975240028229.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:19:53"
    },
    "M412": {
        cn: "竹屿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975296962629.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-08-28 18:22:29"
    },
    "M413": {
        cn: "横屿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975394545733.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-08-28 18:22:46"
    },
    "M414": {
        cn: "后屿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975493570629.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-08-28 18:22:59"
    },
    "M416": {
        cn: "光明港",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975646048325.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:20:11"
    },
    "M417": {
        cn: "鳌峰洲",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975717720133.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:20:20"
    },
    "M418": {
        cn: "花海公园",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975788961861.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:20:27"
    },
    "M419": {
        cn: "会展中心",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754975845912645.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:20:34"
    },
    "M420": {
        cn: "林浦",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2026/03/11/782691800043589.jpg",
        sourceLine: "M3",
        lines: ["M3", "M5"],
        exits: [],
        updatedAt: "2026-09-11 18:20:41"
    },
    "M422": {
        cn: "螺洲温泉",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754976036458565.jpg",
        sourceLine: "M3",
        lines: ["M3"],
        exits: [],
        updatedAt: "2026-09-11 18:20:54"
    },
    "M423": {
        cn: "帝封江",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754976125173829.jpg",
        sourceLine: "M3",
        lines: ["M3", "M4", "M6"],
        exits: [],
        updatedAt: "2026-09-11 18:21:02"
    },
    "M401_2": {
        cn: "荆溪厚屿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754971405234245.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:21:37"
    },
    "M402_2": {
        cn: "农林大学",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754971514953797.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:21:44"
    },
    "M404_2": {
        cn: "阵坂",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754971716145221.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:21:59"
    },
    "M405_2": {
        cn: "马榕",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754971793322053.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:22:05"
    },
    "M407_2": {
        cn: "凤岗里",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754971941695557.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:22:18"
    },
    "M408": {
        cn: "浦上大道",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972000157765.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:22:25"
    },
    "M409_2": {
        cn: "霞镜",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972083003461.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:22:32"
    },
    "M410_2": {
        cn: "东岭",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972151582789.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-08-28 18:20:42"
    },
    "M411_2": {
        cn: "台屿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972225876037.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-08-28 18:21:04"
    },
    "M412_2": {
        cn: "盘屿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972303368261.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:22:44"
    },
    "M413_2": {
        cn: "吴山",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972390944837.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:22:53"
    },
    "M414_2": {
        cn: "盖山竹榄",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972464853061.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:22:59"
    },
    "M415": {
        cn: "义序",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972526747717.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:23:05"
    },
    "M417_2": {
        cn: "螺洲古镇",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754972769919045.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:23:20"
    },
    "M418_2": {
        cn: "前锦",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754974392201285.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:23:27"
    },
    "M419_2": {
        cn: "龙江",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754974458347589.jpg",
        sourceLine: "M4",
        lines: ["M4"],
        exits: [],
        updatedAt: "2026-09-11 18:23:35"
    },
    "M516": {
        cn: "万寿",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973918851141.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:41:03"
    },
    "M514": {
        cn: "下吴",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973851910213.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:40:34"
    },
    "M512": {
        cn: "沙京",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973766950981.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:40:01"
    },
    "M511": {
        cn: "鹤上",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973708398661.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:39:27"
    },
    "M510": {
        cn: "吴航",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973640982597.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:39:00"
    },
    "M509": {
        cn: "十洋",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973581422661.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:38:40"
    },
    "M508": {
        cn: "郑和",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973510004805.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:38:12"
    },
    "M507": {
        cn: "航城",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973440077893.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:37:40"
    },
    "M506": {
        cn: "营前",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973375479877.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:37:04"
    },
    "M503": {
        cn: "樟岚",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973164920901.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:35:31"
    },
    "M501": {
        cn: "潘墩",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754973041717317.jpg",
        sourceLine: "M5",
        lines: ["M5"],
        exits: [],
        updatedAt: "2026-02-02 17:34:41"
    },
    "M615": {
        cn: "文岭",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977695551557.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-06 17:53:46"
    },
    "M614": {
        cn: "机场",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977623257157.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-06 17:53:33"
    },
    "M613": {
        cn: "滨海中央商务区",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977560854597.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-02 17:57:29"
    },
    "M612": {
        cn: "大数据",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977495478341.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-07-29 17:17:40"
    },
    "M609": {
        cn: "首占",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977407705157.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-02 17:55:57"
    },
    "M608": {
        cn: "祥谦",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977330352197.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-02 17:55:36"
    },
    "M605": {
        cn: "三叉街（滨海快线）",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977185230917.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-06 17:51:48"
    },
    "M604": {
        cn: "南公园",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977114009669.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-02 17:53:33"
    },
    "M603": {
        cn: "闽都",
        map: "https://www.fzmtr.com/fzmtrstorage/resources/image/2025/12/23/754977045082181.jpg",
        sourceLine: "M6",
        lines: ["M6"],
        exits: [],
        updatedAt: "2026-02-02 18:44:10"
    }
};
