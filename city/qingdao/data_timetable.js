/**
 * CGo OpenMap - 青岛车站首末班车时刻表
 *
 * 参考合肥城市实现扩展：
 * - 对象保留 url，继续支持车站信息板“官网查询”；
 * - items 原样保存用户工作簿的列标题和值；
 * - 可表达“全程/终到某站”等多个末班车；
 * - 可表达8号线机场直达列车第1/2/3班。
 */
const GLOBAL_SCHEDULE_DATA = {
    "QDM15": {
        "M1501": { url: "https://www.qd-metro.com/operate.php" },
        "M1502": { url: "https://www.qd-metro.com/operate.php" },
        "M1503": { url: "https://www.qd-metro.com/operate.php" },
        "M1504": { url: "https://www.qd-metro.com/operate.php" },
        "M0713": { url: "https://www.qd-metro.com/operate.php" },
        "M1506": { url: "https://www.qd-metro.com/operate.php" },
        "M0907": { url: "https://www.qd-metro.com/operate.php" },
        "M1508": { url: "https://www.qd-metro.com/operate.php" },
        "M1509": { url: "https://www.qd-metro.com/operate.php" },
        "M1510": { url: "https://www.qd-metro.com/operate.php" },
        "M1511": { url: "https://www.qd-metro.com/operate.php" },
        "M1512": { url: "https://www.qd-metro.com/operate.php" },
        "M1513": { url: "https://www.qd-metro.com/operate.php" },
        "M1514": { url: "https://www.qd-metro.com/operate.php" },
        "M1515": { url: "https://www.qd-metro.com/operate.php" },
        "M1516": { url: "https://www.qd-metro.com/operate.php" },
        "M0208": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM13": {
        "M1301": {
            cn: "嘉陵江西路",
            sourceCn: "嘉陵江西路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "-" },
                { label: "首车-往董家口火车站", value: "05:55" },
                { label: "末车-往嘉陵江西路", value: "-" },
                { label: "末车-往董家口火车站-全程", value: "22:00" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:15" }
            ]
        },
        "M1302": {
            cn: "香江路",
            sourceCn: "香江路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:14" },
                { label: "首车-往董家口火车站", value: "05:57" },
                { label: "末车-往嘉陵江西路", value: "22:48" },
                { label: "末车-往董家口火车站-全程", value: "22:02" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:17" }
            ]
        },
        "M1303": {
            cn: "井冈山路",
            sourceCn: "井冈山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:11" },
                { label: "首车-往董家口火车站", value: "05:59" },
                { label: "末车-往嘉陵江西路", value: "22:46" },
                { label: "末车-往董家口火车站-全程", value: "22:04" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:19" }
            ]
        },
        "M1304": {
            cn: "积米崖",
            sourceCn: "积米崖",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:07" },
                { label: "首车-往董家口火车站", value: "06:03" },
                { label: "末车-往嘉陵江西路", value: "22:41" },
                { label: "末车-往董家口火车站-全程", value: "22:08" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:23" }
            ]
        },
        "M1305": {
            cn: "灵山卫",
            sourceCn: "灵山卫",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:04" },
                { label: "首车-往董家口火车站", value: "06:06" },
                { label: "末车-往嘉陵江西路", value: "22:39" },
                { label: "末车-往董家口火车站-全程", value: "22:11" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:26" }
            ]
        },
        "M1306": {
            cn: "学院路",
            sourceCn: "学院路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:02" },
                { label: "首车-往董家口火车站", value: "06:09" },
                { label: "末车-往嘉陵江西路", value: "22:36" },
                { label: "末车-往董家口火车站-全程", value: "22:14" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:29" }
            ]
        },
        "M1307": {
            cn: "朝阳山",
            sourceCn: "朝阳山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:59" },
                { label: "首车-往董家口火车站", value: "06:11" },
                { label: "末车-往嘉陵江西路", value: "22:34" },
                { label: "末车-往董家口火车站-全程", value: "22:16" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:31" }
            ]
        },
        "M1308": {
            cn: "辛屯",
            sourceCn: "辛屯",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:57" },
                { label: "首车-往董家口火车站", value: "06:13" },
                { label: "末车-往嘉陵江西路", value: "22:31" },
                { label: "末车-往董家口火车站-全程", value: "22:18" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:33" }
            ]
        },
        "M1309": {
            cn: "两河",
            sourceCn: "两河",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:54" },
                { label: "首车-往董家口火车站", value: "06:00" },
                { label: "末车-往嘉陵江西路", value: "22:29" },
                { label: "末车-往董家口火车站-全程", value: "22:21" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:36" }
            ]
        },
        "M1310": {
            cn: "隐珠",
            sourceCn: "隐珠",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:50" },
                { label: "首车-往董家口火车站", value: "06:04" },
                { label: "末车-往嘉陵江西路", value: "22:25" },
                { label: "末车-往董家口火车站-全程", value: "22:25" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:40" }
            ]
        },
        "M1311": {
            cn: "凤凰山路",
            sourceCn: "凤凰山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:47" },
                { label: "首车-往董家口火车站", value: "06:06" },
                { label: "末车-往嘉陵江西路", value: "22:22" },
                { label: "末车-往董家口火车站-全程", value: "22:27" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:42" }
            ]
        },
        "M1312": {
            cn: "双珠路",
            sourceCn: "双珠路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:45" },
                { label: "首车-往董家口火车站", value: "06:09" },
                { label: "末车-往嘉陵江西路", value: "22:19" },
                { label: "末车-往董家口火车站-全程", value: "22:30" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:45" }
            ]
        },
        "M1313": {
            cn: "世纪大道",
            sourceCn: "世纪大道",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:00" },
                { label: "首车-往董家口火车站", value: "06:13" },
                { label: "末车-往嘉陵江西路", value: "22:16" },
                { label: "末车-往董家口火车站-全程", value: "22:34" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:49" }
            ]
        },
        "M1314": {
            cn: "盛海路(世博城)",
            sourceCn: "盛海路(世博城)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:58" },
                { label: "首车-往董家口火车站", value: "06:16" },
                { label: "末车-往嘉陵江西路", value: "22:13" },
                { label: "末车-往董家口火车站-全程", value: "22:37" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:52" }
            ]
        },
        "M1315": {
            cn: "大珠山",
            sourceCn: "大珠山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:55" },
                { label: "首车-往董家口火车站", value: "06:00" },
                { label: "末车-往嘉陵江西路", value: "22:10" },
                { label: "末车-往董家口火车站-全程", value: "22:40" },
                { label: "末车-往董家口火车站-终到古镇口", value: "22:55" }
            ]
        },
        "M1316": {
            cn: "张家楼",
            sourceCn: "张家楼",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:49" },
                { label: "首车-往董家口火车站", value: "06:05" },
                { label: "末车-往嘉陵江西路", value: "22:05" },
                { label: "末车-往董家口火车站-全程", value: "22:45" },
                { label: "末车-往董家口火车站-终到古镇口", value: "23:00" }
            ]
        },
        "M1317": {
            cn: "古镇口",
            sourceCn: "古镇口",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:45" },
                { label: "首车-往董家口火车站", value: "06:10" },
                { label: "末车-往嘉陵江西路", value: "22:00" },
                { label: "末车-往董家口火车站-全程", value: "22:50" },
                { label: "末车-往董家口火车站-终到古镇口", value: "-" }
            ]
        },
        "M1318": {
            cn: "龙湾",
            sourceCn: "龙湾",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:04" },
                { label: "首车-往董家口火车站", value: "06:16" },
                { label: "末车-往嘉陵江西路", value: "21:54" },
                { label: "末车-往董家口火车站-全程", value: "22:56" },
                { label: "末车-往董家口火车站-终到古镇口", value: "-" }
            ]
        },
        "M1319": {
            cn: "琅琊",
            sourceCn: "琅琊",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "06:00" },
                { label: "首车-往董家口火车站", value: "06:20" },
                { label: "末车-往嘉陵江西路", value: "21:50" },
                { label: "末车-往董家口火车站-全程", value: "23:00" },
                { label: "末车-往董家口火车站-终到古镇口", value: "-" }
            ]
        },
        "M1320": {
            cn: "贡口湾",
            sourceCn: "贡口湾",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:56" },
                { label: "首车-往董家口火车站", value: "06:24" },
                { label: "末车-往嘉陵江西路", value: "21:46" },
                { label: "末车-往董家口火车站-全程", value: "23:04" },
                { label: "末车-往董家口火车站-终到古镇口", value: "-" }
            ]
        },
        "M1321": {
            cn: "董家口港",
            sourceCn: "董家口港",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:52" },
                { label: "首车-往董家口火车站", value: "06:27" },
                { label: "末车-往嘉陵江西路", value: "21:42" },
                { label: "末车-往董家口火车站-全程", value: "23:08" },
                { label: "末车-往董家口火车站-终到古镇口", value: "-" }
            ]
        },
        "M1322": {
            cn: "泊里",
            sourceCn: "泊里",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:49" },
                { label: "首车-往董家口火车站", value: "06:31" },
                { label: "末车-往嘉陵江西路", value: "21:39" },
                { label: "末车-往董家口火车站-全程", value: "23:11" },
                { label: "末车-往董家口火车站-终到古镇口", value: "-" }
            ]
        },
        "M1323": {
            cn: "董家口火车站",
            sourceCn: "董家口火车站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往嘉陵江西路", value: "05:45" },
                { label: "首车-往董家口火车站", value: "-" },
                { label: "末车-往嘉陵江西路", value: "21:35" },
                { label: "末车-往董家口火车站-全程", value: "-" },
                { label: "末车-往董家口火车站-终到古镇口", value: "-" }
            ]
        }
    },
    "QDM11": {
        "M0216": {
            cn: "苗岭路",
            sourceCn: "苗岭路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "-" },
                { label: "首车-往钱谷山", value: "06:00" },
                { label: "末车-往苗岭路", value: "-" },
                { label: "末车-往钱谷山-全程", value: "22:15" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:25" }
            ]
        },
        "M1102": {
            cn: "会展中心",
            sourceCn: "会展中心",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:34" },
                { label: "首车-往钱谷山", value: "06:01" },
                { label: "末车-往苗岭路", value: "22:27" },
                { label: "末车-往钱谷山-全程", value: "22:16" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:26" }
            ]
        },
        "M1103": {
            cn: "青岛二中",
            sourceCn: "青岛二中",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:31" },
                { label: "首车-往钱谷山", value: "06:03" },
                { label: "末车-往苗岭路", value: "22:25" },
                { label: "末车-往钱谷山-全程", value: "22:18" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:28" }
            ]
        },
        "M1104": {
            cn: "青岛科大",
            sourceCn: "青岛科大",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:29" },
                { label: "首车-往钱谷山", value: "06:06" },
                { label: "末车-往苗岭路", value: "22:22" },
                { label: "末车-往钱谷山-全程", value: "22:21" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:31" }
            ]
        },
        "M1105": {
            cn: "张村",
            sourceCn: "张村",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:27" },
                { label: "首车-往钱谷山", value: "06:08" },
                { label: "末车-往苗岭路", value: "22:20" },
                { label: "末车-往钱谷山-全程", value: "22:23" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:33" }
            ]
        },
        "M1106": {
            cn: "枯桃",
            sourceCn: "枯桃",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:25" },
                { label: "首车-往钱谷山", value: "06:10" },
                { label: "末车-往苗岭路", value: "22:18" },
                { label: "末车-往钱谷山-全程", value: "22:25" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:35" }
            ]
        },
        "M1107": {
            cn: "海洋大学",
            sourceCn: "海洋大学",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:23" },
                { label: "首车-往钱谷山", value: "06:12" },
                { label: "末车-往苗岭路", value: "22:16" },
                { label: "末车-往钱谷山-全程", value: "22:27" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:37" }
            ]
        },
        "M1108": {
            cn: "世博园",
            sourceCn: "世博园",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:20" },
                { label: "首车-往钱谷山", value: "06:15" },
                { label: "末车-往苗岭路", value: "22:13" },
                { label: "末车-往钱谷山-全程", value: "22:30" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:40" }
            ]
        },
        "M1109": {
            cn: "北宅",
            sourceCn: "北宅",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:16" },
                { label: "首车-往钱谷山", value: "06:19" },
                { label: "末车-往苗岭路", value: "22:09" },
                { label: "末车-往钱谷山-全程", value: "22:34" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:44" }
            ]
        },
        "M1110": {
            cn: "北九水",
            sourceCn: "北九水",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:13" },
                { label: "首车-往钱谷山", value: "06:22" },
                { label: "末车-往苗岭路", value: "22:06" },
                { label: "末车-往钱谷山-全程", value: "22:37" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:47" }
            ]
        },
        "M1111": {
            cn: "庙石",
            sourceCn: "庙石",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:07" },
                { label: "首车-往钱谷山", value: "06:28" },
                { label: "末车-往苗岭路", value: "22:01" },
                { label: "末车-往钱谷山-全程", value: "22:43" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:53" }
            ]
        },
        "M1112": {
            cn: "浦里",
            sourceCn: "浦里",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "06:04" },
                { label: "首车-往钱谷山", value: "06:31" },
                { label: "末车-往苗岭路", value: "21:57" },
                { label: "末车-往钱谷山-全程", value: "22:46" },
                { label: "末车-往钱谷山-终到皋虞", value: "22:56" }
            ]
        },
        "M1113": {
            cn: "鳌山卫",
            sourceCn: "鳌山卫",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:59" },
                { label: "首车-往钱谷山", value: "06:35" },
                { label: "末车-往苗岭路", value: "21:53" },
                { label: "末车-往钱谷山-全程", value: "22:50" },
                { label: "末车-往钱谷山-终到皋虞", value: "23:00" }
            ]
        },
        "M1114": {
            cn: "山东大学",
            sourceCn: "山东大学",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:56" },
                { label: "首车-往钱谷山", value: "06:38" },
                { label: "末车-往苗岭路", value: "21:50" },
                { label: "末车-往钱谷山-全程", value: "22:53" },
                { label: "末车-往钱谷山-终到皋虞", value: "23:03" }
            ]
        },
        "M1115": {
            cn: "蓝色硅谷",
            sourceCn: "蓝色硅谷",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:54" },
                { label: "首车-往钱谷山", value: "06:41" },
                { label: "末车-往苗岭路", value: "21:47" },
                { label: "末车-往钱谷山-全程", value: "22:56" },
                { label: "末车-往钱谷山-终到皋虞", value: "23:06" }
            ]
        },
        "M1116": {
            cn: "水泊",
            sourceCn: "水泊",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:52" },
                { label: "首车-往钱谷山", value: "06:43" },
                { label: "末车-往苗岭路", value: "21:45" },
                { label: "末车-往钱谷山-全程", value: "22:58" },
                { label: "末车-往钱谷山-终到皋虞", value: "23:08" }
            ]
        },
        "M1117": {
            cn: "博览中心",
            sourceCn: "博览中心",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:55" },
                { label: "首车-往钱谷山", value: "06:46" },
                { label: "末车-往苗岭路", value: "21:42" },
                { label: "末车-往钱谷山-全程", value: "23:01" },
                { label: "末车-往钱谷山-终到皋虞", value: "23:11" }
            ]
        },
        "M1118": {
            cn: "温泉东",
            sourceCn: "温泉东",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:52" },
                { label: "首车-往钱谷山", value: "06:49" },
                { label: "末车-往苗岭路", value: "21:39" },
                { label: "末车-往钱谷山-全程", value: "23:04" },
                { label: "末车-往钱谷山-终到皋虞", value: "23:14" }
            ]
        },
        "M1119": {
            cn: "皋虞",
            sourceCn: "皋虞",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:55" },
                { label: "首车-往钱谷山", value: "06:53" },
                { label: "末车-往苗岭路", value: "21:35" },
                { label: "末车-往钱谷山-全程", value: "23:08" },
                { label: "末车-往钱谷山-终到皋虞", value: "-" }
            ]
        },
        "M1120": {
            cn: "臧村",
            sourceCn: "臧村",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:52" },
                { label: "首车-往钱谷山", value: "06:55" },
                { label: "末车-往苗岭路", value: "21:32" },
                { label: "末车-往钱谷山-全程", value: "23:10" },
                { label: "末车-往钱谷山-终到皋虞", value: "-" }
            ]
        },
        "M1121": {
            cn: "钱谷山",
            sourceCn: "钱谷山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往苗岭路", value: "05:50" },
                { label: "首车-往钱谷山", value: "-" },
                { label: "末车-往苗岭路", value: "21:30" },
                { label: "末车-往钱谷山-全程", value: "-" },
                { label: "末车-往钱谷山-终到皋虞", value: "-" }
            ]
        },
        "M1122": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM09": {
        "M0901": { url: "https://www.qd-metro.com/operate.php" },
        "M0902": { url: "https://www.qd-metro.com/operate.php" },
        "M0903": { url: "https://www.qd-metro.com/operate.php" },
        "M0904": { url: "https://www.qd-metro.com/operate.php" },
        "M0905": { url: "https://www.qd-metro.com/operate.php" },
        "M0906": { url: "https://www.qd-metro.com/operate.php" },
        "M0907": { url: "https://www.qd-metro.com/operate.php" },
        "M0908": { url: "https://www.qd-metro.com/operate.php" },
        "M0715": { url: "https://www.qd-metro.com/operate.php" },
        "M0910": { url: "https://www.qd-metro.com/operate.php" },
        "M0911": { url: "https://www.qd-metro.com/operate.php" },
        "M0912": { url: "https://www.qd-metro.com/operate.php" },
        "M0913": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM08B": {
        "M0804": { url: "https://www.qd-metro.com/operate.php" },
        "M0819": { url: "https://www.qd-metro.com/operate.php" },
        "M0820": { url: "https://www.qd-metro.com/operate.php" },
        "M0821": { url: "https://www.qd-metro.com/operate.php" },
        "M0822": { url: "https://www.qd-metro.com/operate.php" },
        "M0823": { url: "https://www.qd-metro.com/operate.php" },
        "M0824": { url: "https://www.qd-metro.com/operate.php" },
        "M0825": { url: "https://www.qd-metro.com/operate.php" },
        "M0826": { url: "https://www.qd-metro.com/operate.php" },
        "M0827": { url: "https://www.qd-metro.com/operate.php" },
        "M0828": { url: "https://www.qd-metro.com/operate.php" },
        "M0829": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM08": {
        "M0801": {
            cn: "胶州北站",
            sourceCn: "胶州北站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "-" },
                { label: "首车-往青岛北站", value: "05:45" },
                { label: "末车-往胶州北站", value: "-" },
                { label: "末车-往青岛北站", value: "22:00" },
            ]
        },
        "M0802": {
            cn: "胶东机场",
            sourceCn: "胶东机场",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "直达列车-青岛北站→胶东机场-第1班", value: "05:48到达" },
                { label: "直达列车-青岛北站→胶东机场-第2班", value: "06:13到达" },
                { label: "直达列车-青岛北站→胶东机场-第3班", value: "06:38到达" },
                { label: "首车-往胶州北站", value: "06:57" },
                { label: "首车-往青岛北站", value: "05:50" },
                { label: "末车-往胶州北站", value: "22:52" },
                { label: "末车-往青岛北站", value: "22:05" },
                { label: "直达列车-胶东机场→青岛北站-第1班", value: "22:25" },
                { label: "直达列车-胶东机场→青岛北站-第2班", value: "22:45" },
                { label: "直达列车-胶东机场→青岛北站-第3班", value: "23:15" }
            ]
        },
        "M0803": {
            cn: "胶东",
            sourceCn: "胶东",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:52" },
                { label: "首车-往青岛北站", value: "05:45" },
                { label: "末车-往胶州北站", value: "22:47" },
                { label: "末车-往青岛北站", value: "22:10" },
            ]
        },
        "M0804": {
            cn: "大涧",
            sourceCn: "大涧",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:46" },
                { label: "首车-往青岛北站", value: "05:51" },
                { label: "末车-往胶州北站", value: "22:41" },
                { label: "末车-往青岛北站", value: "22:17" },
            ]
        },
        "M0805": {
            cn: "红岛火车站",
            sourceCn: "红岛火车站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:42" },
                { label: "首车-往青岛北站", value: "05:55" },
                { label: "末车-往胶州北站", value: "22:37" },
                { label: "末车-往青岛北站", value: "22:21" },
            ]
        },
        "M0806": {
            cn: "健康中心",
            sourceCn: "健康中心",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:39" },
                { label: "首车-往青岛北站", value: "05:58" },
                { label: "末车-往胶州北站", value: "22:34" },
                { label: "末车-往青岛北站", value: "22:24" },
            ]
        },
        "M0807": {
            cn: "健身中心(红岛会展)",
            sourceCn: "健身中心(红岛会展)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:36" },
                { label: "首车-往青岛北站", value: "06:00" },
                { label: "末车-往胶州北站", value: "22:31" },
                { label: "末车-往青岛北站", value: "22:26" },
            ]
        },
        "M0808": {
            cn: "观涛",
            sourceCn: "观涛",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:32" },
                { label: "首车-往青岛北站", value: "06:05" },
                { label: "末车-往胶州北站", value: "22:27" },
                { label: "末车-往青岛北站", value: "22:30" },
            ]
        },
        "M0809": {
            cn: "红岛科技馆(方特)",
            sourceCn: "红岛科技馆(方特)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:29" },
                { label: "首车-往青岛北站", value: "06:08" },
                { label: "末车-往胶州北站", value: "22:24" },
                { label: "末车-往青岛北站", value: "22:34" },
            ]
        },
        "M0810": {
            cn: "大洋",
            sourceCn: "大洋",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往胶州北站", value: "06:26" },
                { label: "首车-往青岛北站", value: "06:10" },
                { label: "末车-往胶州北站", value: "22:21" },
                { label: "末车-往青岛北站", value: "22:36" },
            ]
        },
        "M0301": {
            cn: "青岛北站",
            sourceCn: "青岛北站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "直达列车-青岛北站→胶东机场-第1班", value: "05:20" },
                { label: "直达列车-青岛北站→胶东机场-第2班", value: "05:45" },
                { label: "直达列车-青岛北站→胶东机场-第3班", value: "06:10" },
                { label: "首车-往胶州北站", value: "06:20" },
                { label: "首车-往青岛北站", value: "-" },
                { label: "末车-往胶州北站", value: "22:15" },
                { label: "末车-往青岛北站", value: "-" },
                { label: "直达列车-胶东机场→青岛北站-第1班", value: "22:53到达" },
                { label: "直达列车-胶东机场→青岛北站-第2班", value: "23:13到达" },
                { label: "直达列车-胶东机场→青岛北站-第3班", value: "23:43到达" }
            ]
        },
        "M0812": { url: "https://www.qd-metro.com/operate.php" },
        "M0813": { url: "https://www.qd-metro.com/operate.php" },
        "M0814": { url: "https://www.qd-metro.com/operate.php" },
        "M0815": { url: "https://www.qd-metro.com/operate.php" },
        "M0418": { url: "https://www.qd-metro.com/operate.php" },
        "M0817": { url: "https://www.qd-metro.com/operate.php" },
        "M0316": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM07N": {
        "M0701": { url: "https://www.qd-metro.com/operate.php" },
        "M0702": { url: "https://www.qd-metro.com/operate.php" },
        "M0703": { url: "https://www.qd-metro.com/operate.php" },
        "M0704": { url: "https://www.qd-metro.com/operate.php" },
        "M0705": { url: "https://www.qd-metro.com/operate.php" },
        "M0706": { url: "https://www.qd-metro.com/operate.php" },
        "M0707": { url: "https://www.qd-metro.com/operate.php" },
        "M0708": { url: "https://www.qd-metro.com/operate.php" },
        "M0709": { url: "https://www.qd-metro.com/operate.php" },
        "M0710": { url: "https://www.qd-metro.com/operate.php" },
        "M0711": { url: "https://www.qd-metro.com/operate.php" },
        "M0712": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM07S": {
        "M0112": { url: "https://www.qd-metro.com/operate.php" },
        "M0724": { url: "https://www.qd-metro.com/operate.php" },
        "M0303": { url: "https://www.qd-metro.com/operate.php" },
        "M0812": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM06": {
        "M0601": {
            cn: "横云山路",
            sourceCn: "横云山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "-" },
                { label: "首车-往灵山湾", value: "05:42" },
                { label: "末车-往横云山路", value: "-" },
                { label: "末车-往灵山湾", value: "21:40" }
            ]
        },
        "M0602": {
            cn: "山王河(福莱社区)",
            sourceCn: "山王河(福莱社区)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:32" },
                { label: "首车-往灵山湾", value: "05:44" },
                { label: "末车-往横云山路", value: "22:47" },
                { label: "末车-往灵山湾", value: "21:42" }
            ]
        },
        "M0603": {
            cn: "河洛埠(中德生态园)",
            sourceCn: "河洛埠(中德生态园)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:30" },
                { label: "首车-往灵山湾", value: "05:46" },
                { label: "末车-往横云山路", value: "22:45" },
                { label: "末车-往灵山湾", value: "21:44" }
            ]
        },
        "M0604": {
            cn: "青岛九中(幸福小镇)",
            sourceCn: "青岛九中(幸福小镇)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:27" },
                { label: "首车-往灵山湾", value: "05:49" },
                { label: "末车-往横云山路", value: "22:42" },
                { label: "末车-往灵山湾", value: "21:47" }
            ]
        },
        "M0605": {
            cn: "抓马山",
            sourceCn: "抓马山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:25" },
                { label: "首车-往灵山湾", value: "05:51" },
                { label: "末车-往横云山路", value: "22:40" },
                { label: "末车-往灵山湾", value: "21:49" }
            ]
        },
        "M0606": {
            cn: "马家楼",
            sourceCn: "马家楼",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:22" },
                { label: "首车-往灵山湾", value: "05:54" },
                { label: "末车-往横云山路", value: "22:37" },
                { label: "末车-往灵山湾", value: "21:52" }
            ]
        },
        "M0607": {
            cn: "薛家泊子",
            sourceCn: "薛家泊子",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:20" },
                { label: "首车-往灵山湾", value: "05:56" },
                { label: "末车-往横云山路", value: "22:35" },
                { label: "末车-往灵山湾", value: "21:54" }
            ]
        },
        "M0608": {
            cn: "港头",
            sourceCn: "港头",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:17" },
                { label: "首车-往灵山湾", value: "05:59" },
                { label: "末车-往横云山路", value: "22:32" },
                { label: "末车-往灵山湾", value: "21:57" }
            ]
        },
        "M0609": {
            cn: "青大附院西海岸院区",
            sourceCn: "青大附院西海岸院区",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:14" },
                { label: "首车-往灵山湾", value: "06:02" },
                { label: "末车-往横云山路", value: "22:29" },
                { label: "末车-往灵山湾", value: "22:00" }
            ]
        },
        "M0610": {
            cn: "扒山(滨海学院)",
            sourceCn: "扒山(滨海学院)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:12" },
                { label: "首车-往灵山湾", value: "06:04" },
                { label: "末车-往横云山路", value: "22:27" },
                { label: "末车-往灵山湾", value: "22:02" }
            ]
        },
        "M0611": {
            cn: "钱塘江路(青职学院)",
            sourceCn: "钱塘江路(青职学院)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:10" },
                { label: "首车-往灵山湾", value: "06:07" },
                { label: "末车-往横云山路", value: "22:25" },
                { label: "末车-往灵山湾", value: "22:05" }
            ]
        },
        "M0612": {
            cn: "九顶山",
            sourceCn: "九顶山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:07" },
                { label: "首车-往灵山湾", value: "06:09" },
                { label: "末车-往横云山路", value: "22:22" },
                { label: "末车-往灵山湾", value: "22:07" }
            ]
        },
        "M0141": {
            cn: "王家港",
            sourceCn: "王家港",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:04" },
                { label: "首车-往灵山湾", value: "06:12" },
                { label: "末车-往横云山路", value: "22:19" },
                { label: "末车-往灵山湾", value: "22:10" }
            ]
        },
        "M0614": {
            cn: "北门外",
            sourceCn: "北门外",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "06:01" },
                { label: "首车-往灵山湾", value: "06:15" },
                { label: "末车-往横云山路", value: "22:16" },
                { label: "末车-往灵山湾", value: "22:13" }
            ]
        },
        "M0615": {
            cn: "西门外",
            sourceCn: "西门外",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "05:59" },
                { label: "首车-往灵山湾", value: "06:17" },
                { label: "末车-往横云山路", value: "22:14" },
                { label: "末车-往灵山湾", value: "22:15" }
            ]
        },
        "M0616": {
            cn: "毛家山(黄海学院)",
            sourceCn: "毛家山(黄海学院)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "05:57" },
                { label: "首车-往灵山湾", value: "06:20" },
                { label: "末车-往横云山路", value: "22:12" },
                { label: "末车-往灵山湾", value: "22:18" }
            ]
        },
        "M0617": {
            cn: "赵家庙(影视产业园)",
            sourceCn: "赵家庙(影视产业园)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "05:54" },
                { label: "首车-往灵山湾", value: "06:22" },
                { label: "末车-往横云山路", value: "22:09" },
                { label: "末车-往灵山湾", value: "22:20" }
            ]
        },
        "M0618": {
            cn: "星海滩路",
            sourceCn: "星海滩路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "05:52" },
                { label: "首车-往灵山湾", value: "06:25" },
                { label: "末车-往横云山路", value: "22:07" },
                { label: "末车-往灵山湾", value: "22:23" }
            ]
        },
        "M0619": {
            cn: "华山",
            sourceCn: "华山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "05:49" },
                { label: "首车-往灵山湾", value: "06:27" },
                { label: "末车-往横云山路", value: "22:04" },
                { label: "末车-往灵山湾", value: "22:25" }
            ]
        },
        "M1308": {
            cn: "辛屯",
            sourceCn: "辛屯",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "05:47" },
                { label: "首车-往灵山湾", value: "06:29" },
                { label: "末车-往横云山路", value: "22:02" },
                { label: "末车-往灵山湾", value: "22:27" }
            ]
        },
        "M0621": {
            cn: "灵山湾",
            sourceCn: "灵山湾",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往横云山路", value: "05:45" },
                { label: "首车-往灵山湾", value: "-" },
                { label: "末车-往横云山路", value: "22:00" },
                { label: "末车-往灵山湾", value: "-" }
            ]
        },
        "M0622": { url: "https://www.qd-metro.com/operate.php" },
        "M0623": { url: "https://www.qd-metro.com/operate.php" },
        "M0624": { url: "https://www.qd-metro.com/operate.php" },
        "M0625": { url: "https://www.qd-metro.com/operate.php" },
        "M1312": { url: "https://www.qd-metro.com/operate.php" },
        "M0627": { url: "https://www.qd-metro.com/operate.php" },
        "M0628": { url: "https://www.qd-metro.com/operate.php" },
        "M0629": { url: "https://www.qd-metro.com/operate.php" },
        "M0630": { url: "https://www.qd-metro.com/operate.php" },
        "M0631": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM05": {
        "M0221": { url: "https://www.qd-metro.com/operate.php" },
        "M0502": { url: "https://www.qd-metro.com/operate.php" },
        "M0503": { url: "https://www.qd-metro.com/operate.php" },
        "M0314": { url: "https://www.qd-metro.com/operate.php" },
        "M0817": { url: "https://www.qd-metro.com/operate.php" },
        "M0506": { url: "https://www.qd-metro.com/operate.php" },
        "M0507": { url: "https://www.qd-metro.com/operate.php" },
        "M0124": { url: "https://www.qd-metro.com/operate.php" },
        "M0509": { url: "https://www.qd-metro.com/operate.php" },
        "M0510": { url: "https://www.qd-metro.com/operate.php" },
        "M0511": { url: "https://www.qd-metro.com/operate.php" },
        "M0512": { url: "https://www.qd-metro.com/operate.php" },
        "M0513": { url: "https://www.qd-metro.com/operate.php" },
        "M0514": { url: "https://www.qd-metro.com/operate.php" },
        "M0515": { url: "https://www.qd-metro.com/operate.php" },
        "M0516": { url: "https://www.qd-metro.com/operate.php" },
        "M0117": { url: "https://www.qd-metro.com/operate.php" },
        "M0813": { url: "https://www.qd-metro.com/operate.php" },
        "M0519": { url: "https://www.qd-metro.com/operate.php" },
        "M0308": { url: "https://www.qd-metro.com/operate.php" },
        "M0521": { url: "https://www.qd-metro.com/operate.php" },
        "M0522": { url: "https://www.qd-metro.com/operate.php" },
        "M0412": { url: "https://www.qd-metro.com/operate.php" },
        "M0524": { url: "https://www.qd-metro.com/operate.php" },
        "M0525": { url: "https://www.qd-metro.com/operate.php" },
        "M0217": { url: "https://www.qd-metro.com/operate.php" },
        "M0527": { url: "https://www.qd-metro.com/operate.php" },
        "M0528": { url: "https://www.qd-metro.com/operate.php" }
    },
    "QDM04": {
        "M0401": {
            cn: "大河东",
            sourceCn: "大河东",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "-" },
                { label: "首车-往人民会堂", value: "05:45" },
                { label: "末车-往大河东-全程", value: "-" },
                { label: "末车-往大河东-终到段家埠", value: "-" },
                { label: "末车-往人民会堂", value: "22:10" }
            ]
        },
        "M0402": {
            cn: "登瀛",
            sourceCn: "登瀛",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:24" },
                { label: "首车-往人民会堂", value: "05:47" },
                { label: "末车-往大河东-全程", value: "23:32" },
                { label: "末车-往大河东-终到段家埠", value: "-" },
                { label: "末车-往人民会堂", value: "22:12" }
            ]
        },
        "M0403": {
            cn: "段家埠",
            sourceCn: "段家埠",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:22" },
                { label: "首车-往人民会堂", value: "05:50" },
                { label: "末车-往大河东-全程", value: "23:29" },
                { label: "末车-往大河东-终到段家埠", value: "-" },
                { label: "末车-往人民会堂", value: "22:15" }
            ]
        },
        "M0404": {
            cn: "沙子口",
            sourceCn: "沙子口",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:19" },
                { label: "首车-往人民会堂", value: "05:52" },
                { label: "末车-往大河东-全程", value: "23:27" },
                { label: "末车-往大河东-终到段家埠", value: "23:37" },
                { label: "末车-往人民会堂", value: "22:17" }
            ]
        },
        "M0405": {
            cn: "小崂山",
            sourceCn: "小崂山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:17" },
                { label: "首车-往人民会堂", value: "05:54" },
                { label: "末车-往大河东-全程", value: "23:24" },
                { label: "末车-往大河东-终到段家埠", value: "23:34" },
                { label: "末车-往人民会堂", value: "22:19" }
            ]
        },
        "M0406": {
            cn: "南宅科",
            sourceCn: "南宅科",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:15" },
                { label: "首车-往人民会堂", value: "05:56" },
                { label: "末车-往大河东-全程", value: "23:22" },
                { label: "末车-往大河东-终到段家埠", value: "23:32" },
                { label: "末车-往人民会堂", value: "22:21" }
            ]
        },
        "M0407": {
            cn: "彭家庄",
            sourceCn: "彭家庄",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:12" },
                { label: "首车-往人民会堂", value: "05:59" },
                { label: "末车-往大河东-全程", value: "23:19" },
                { label: "末车-往大河东-终到段家埠", value: "23:29" },
                { label: "末车-往人民会堂", value: "22:24" }
            ]
        },
        "M1105": {
            cn: "张村",
            sourceCn: "张村",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:10" },
                { label: "首车-往人民会堂", value: "05:45" },
                { label: "末车-往大河东-全程", value: "23:17" },
                { label: "末车-往大河东-终到段家埠", value: "23:27" },
                { label: "末车-往人民会堂", value: "22:26" }
            ]
        },
        "M0409": {
            cn: "雄安路",
            sourceCn: "科苑经七路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:07" },
                { label: "首车-往人民会堂", value: "05:47" },
                { label: "末车-往大河东-全程", value: "23:14" },
                { label: "末车-往大河东-终到段家埠", value: "23:24" },
                { label: "末车-往人民会堂", value: "22:29" }
            ]
        },
        "M0410": {
            cn: "董家下庄",
            sourceCn: "董家下庄",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:05" },
                { label: "首车-往人民会堂", value: "05:49" },
                { label: "末车-往大河东-全程", value: "23:12" },
                { label: "末车-往大河东-终到段家埠", value: "23:22" },
                { label: "末车-往人民会堂", value: "22:31" }
            ]
        },
        "M0214": {
            cn: "辽阳东路",
            sourceCn: "辽阳东路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:02" },
                { label: "首车-往人民会堂", value: "05:52" },
                { label: "末车-往大河东-全程", value: "23:09" },
                { label: "末车-往大河东-终到段家埠", value: "23:19" },
                { label: "末车-往人民会堂", value: "22:34" }
            ]
        },
        "M0412": {
            cn: "大埠东",
            sourceCn: "大埠东",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:00" },
                { label: "首车-往人民会堂", value: "05:45" },
                { label: "末车-往大河东-全程", value: "23:07" },
                { label: "末车-往大河东-终到段家埠", value: "23:17" },
                { label: "末车-往人民会堂", value: "22:37" }
            ]
        },
        "M0413": {
            cn: "埠西",
            sourceCn: "埠西",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:16" },
                { label: "首车-往人民会堂", value: "05:47" },
                { label: "末车-往大河东-全程", value: "23:05" },
                { label: "末车-往大河东-终到段家埠", value: "23:15" },
                { label: "末车-往人民会堂", value: "22:39" }
            ]
        },
        "M0414": {
            cn: "劲松三路",
            sourceCn: "劲松三路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:14" },
                { label: "首车-往人民会堂", value: "05:49" },
                { label: "末车-往大河东-全程", value: "23:03" },
                { label: "末车-往大河东-终到段家埠", value: "23:13" },
                { label: "末车-往人民会堂", value: "22:41" }
            ]
        },
        "M0415": {
            cn: "洪山坡(妇儿医院)",
            sourceCn: "洪山坡(妇儿医院)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:12" },
                { label: "首车-往人民会堂", value: "05:51" },
                { label: "末车-往大河东-全程", value: "23:00" },
                { label: "末车-往大河东-终到段家埠", value: "23:10" },
                { label: "末车-往人民会堂", value: "22:43" }
            ]
        },
        "M0416": {
            cn: "福辽立交桥",
            sourceCn: "福辽立交桥",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:10" },
                { label: "首车-往人民会堂", value: "05:53" },
                { label: "末车-往大河东-全程", value: "22:59" },
                { label: "末车-往大河东-终到段家埠", value: "23:09" },
                { label: "末车-往人民会堂", value: "22:45" }
            ]
        },
        "M0312": {
            cn: "错埠岭",
            sourceCn: "错埠岭",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:09" },
                { label: "首车-往人民会堂", value: "05:45" },
                { label: "末车-往大河东-全程", value: "22:57" },
                { label: "末车-往大河东-终到段家埠", value: "23:07" },
                { label: "末车-往人民会堂", value: "22:47" }
            ]
        },
        "M0418": {
            cn: "西吴家村",
            sourceCn: "西吴家村",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:06" },
                { label: "首车-往人民会堂", value: "05:47" },
                { label: "末车-往大河东-全程", value: "22:55" },
                { label: "末车-往大河东-终到段家埠", value: "23:05" },
                { label: "末车-往人民会堂", value: "22:49" }
            ]
        },
        "M0122": {
            cn: "海泊桥(海慈医疗)",
            sourceCn: "海泊桥(海慈医疗)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:04" },
                { label: "首车-往人民会堂", value: "05:49" },
                { label: "末车-往大河东-全程", value: "22:53" },
                { label: "末车-往大河东-终到段家埠", value: "23:03" },
                { label: "末车-往人民会堂", value: "22:51" }
            ]
        },
        "M0420": {
            cn: "海泊河公园",
            sourceCn: "海泊河公园",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:02" },
                { label: "首车-往人民会堂", value: "05:51" },
                { label: "末车-往大河东-全程", value: "22:50" },
                { label: "末车-往大河东-终到段家埠", value: "23:00" },
                { label: "末车-往人民会堂", value: "22:53" }
            ]
        },
        "M0421": {
            cn: "昌乐路",
            sourceCn: "昌乐路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:00" },
                { label: "首车-往人民会堂", value: "05:54" },
                { label: "末车-往大河东-全程", value: "22:48" },
                { label: "末车-往大河东-终到段家埠", value: "22:58" },
                { label: "末车-往人民会堂", value: "22:56" }
            ]
        },
        "M0230": {
            cn: "泰山路",
            sourceCn: "泰山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:06" },
                { label: "首车-往人民会堂", value: "05:56" },
                { label: "末车-往大河东-全程", value: "22:46" },
                { label: "末车-往大河东-终到段家埠", value: "22:56" },
                { label: "末车-往人民会堂", value: "22:58" }
            ]
        },
        "M0125": {
            cn: "观象山(市立医院)",
            sourceCn: "观象山(市立医院)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:03" },
                { label: "首车-往人民会堂", value: "05:58" },
                { label: "末车-往大河东-全程", value: "22:43" },
                { label: "末车-往大河东-终到段家埠", value: "22:53" },
                { label: "末车-往人民会堂", value: "23:01" }
            ]
        },
        "M0424": {
            cn: "信号山(青大附院)",
            sourceCn: "信号山(青大附院)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:01" },
                { label: "首车-往人民会堂", value: "06:00" },
                { label: "末车-往大河东-全程", value: "22:41" },
                { label: "末车-往大河东-终到段家埠", value: "22:51" },
                { label: "末车-往人民会堂", value: "23:02" }
            ]
        },
        "M0321": {
            cn: "人民会堂",
            sourceCn: "人民会堂",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往大河东", value: "06:00" },
                { label: "首车-往人民会堂", value: "-" },
                { label: "末车-往大河东-全程", value: "22:40" },
                { label: "末车-往大河东-终到段家埠", value: "22:50" },
                { label: "末车-往人民会堂", value: "-" }
            ]
        }
    },
    "QDM03": {
        "M0301": {
            cn: "青岛北站",
            sourceCn: "青岛北站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "-" },
                { label: "首车-往青岛站", value: "05:30" },
                { label: "末车-往青岛北站", value: "-" },
                { label: "末车-往青岛站-全程", value: "22:45" },
                { label: "末车-往青岛站-终到延安三路", value: "23:05" }
            ]
        },
        "M0302": {
            cn: "永平路",
            sourceCn: "永平路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:57" },
                { label: "首车-往青岛站", value: "05:32" },
                { label: "末车-往青岛北站", value: "23:38" },
                { label: "末车-往青岛站-全程", value: "22:47" },
                { label: "末车-往青岛站-终到延安三路", value: "23:07" }
            ]
        },
        "M0303": {
            cn: "振华路",
            sourceCn: "振华路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:54" },
                { label: "首车-往青岛站", value: "05:34" },
                { label: "末车-往青岛北站", value: "23:36" },
                { label: "末车-往青岛站-全程", value: "22:49" },
                { label: "末车-往青岛站-终到延安三路", value: "23:09" }
            ]
        },
        "M0304": {
            cn: "君峰路",
            sourceCn: "君峰路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:53" },
                { label: "首车-往青岛站", value: "05:36" },
                { label: "末车-往青岛北站", value: "23:34" },
                { label: "末车-往青岛站-全程", value: "22:51" },
                { label: "末车-往青岛站-终到延安三路", value: "23:11" }
            ]
        },
        "M0305": {
            cn: "李村",
            sourceCn: "李村",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:50" },
                { label: "首车-往青岛站", value: "05:38" },
                { label: "末车-往青岛北站", value: "23:32" },
                { label: "末车-往青岛站-全程", value: "22:53" },
                { label: "末车-往青岛站-终到延安三路", value: "23:13" }
            ]
        },
        "M0306": {
            cn: "万年泉路",
            sourceCn: "万年泉路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:48" },
                { label: "首车-往青岛站", value: "05:41" },
                { label: "末车-往青岛北站", value: "23:29" },
                { label: "末车-往青岛站-全程", value: "22:56" },
                { label: "末车-往青岛站-终到延安三路", value: "23:16" }
            ]
        },
        "M0307": {
            cn: "海尔路",
            sourceCn: "海尔路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:46" },
                { label: "首车-往青岛站", value: "05:43" },
                { label: "末车-往青岛北站", value: "23:27" },
                { label: "末车-往青岛站-全程", value: "22:58" },
                { label: "末车-往青岛站-终到延安三路", value: "23:18" }
            ]
        },
        "M0308": {
            cn: "地铁大厦",
            sourceCn: "地铁大厦",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:44" },
                { label: "首车-往青岛站", value: "05:45" },
                { label: "末车-往青岛北站", value: "23:25" },
                { label: "末车-往青岛站-全程", value: "23:00" },
                { label: "末车-往青岛站-终到延安三路", value: "23:20" }
            ]
        },
        "M0309": {
            cn: "长沙路",
            sourceCn: "长沙路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:41" },
                { label: "首车-往青岛站", value: "05:47" },
                { label: "末车-往青岛北站", value: "23:23" },
                { label: "末车-往青岛站-全程", value: "23:02" },
                { label: "末车-往青岛站-终到延安三路", value: "23:22" }
            ]
        },
        "M0310": {
            cn: "双山",
            sourceCn: "双山",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:40" },
                { label: "首车-往青岛站", value: "05:49" },
                { label: "末车-往青岛北站", value: "23:21" },
                { label: "末车-往青岛站-全程", value: "23:04" },
                { label: "末车-往青岛站-终到延安三路", value: "23:24" }
            ]
        },
        "M0311": {
            cn: "清江路",
            sourceCn: "清江路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:53" },
                { label: "首车-往青岛站", value: "05:52" },
                { label: "末车-往青岛北站", value: "23:18" },
                { label: "末车-往青岛站-全程", value: "23:07" },
                { label: "末车-往青岛站-终到延安三路", value: "23:27" }
            ]
        },
        "M0312": {
            cn: "错埠岭",
            sourceCn: "错埠岭",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:50" },
                { label: "首车-往青岛站", value: "05:54" },
                { label: "末车-往青岛北站", value: "23:16" },
                { label: "末车-往青岛站-全程", value: "23:09" },
                { label: "末车-往青岛站-终到延安三路", value: "23:29" }
            ]
        },
        "M0313": {
            cn: "敦化路",
            sourceCn: "敦化路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:48" },
                { label: "首车-往青岛站", value: "05:56" },
                { label: "末车-往青岛北站", value: "23:14" },
                { label: "末车-往青岛站-全程", value: "23:11" },
                { label: "末车-往青岛站-终到延安三路", value: "23:31" }
            ]
        },
        "M0314": {
            cn: "宁夏路",
            sourceCn: "宁夏路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:46" },
                { label: "首车-往青岛站", value: "05:58" },
                { label: "末车-往青岛北站", value: "23:12" },
                { label: "末车-往青岛站-全程", value: "23:13" },
                { label: "末车-往青岛站-终到延安三路", value: "23:33" }
            ]
        },
        "M0315": {
            cn: "江西路",
            sourceCn: "江西路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:44" },
                { label: "首车-往青岛站", value: "06:00" },
                { label: "末车-往青岛北站", value: "23:10" },
                { label: "末车-往青岛站-全程", value: "23:15" },
                { label: "末车-往青岛站-终到延安三路", value: "23:35" }
            ]
        },
        "M0316": {
            cn: "五四广场",
            sourceCn: "五四广场",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:41" },
                { label: "首车-往青岛站", value: "06:02" },
                { label: "末车-往青岛北站", value: "23:07" },
                { label: "末车-往青岛站-全程", value: "23:17" },
                { label: "末车-往青岛站-终到延安三路", value: "23:37" }
            ]
        },
        "M0317": {
            cn: "延安三路",
            sourceCn: "延安三路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:40" },
                { label: "首车-往青岛站", value: "06:05" },
                { label: "末车-往青岛北站", value: "23:05" },
                { label: "末车-往青岛站-全程", value: "23:20" },
                { label: "末车-往青岛站-终到延安三路", value: "-" }
            ]
        },
        "M0318": {
            cn: "太平角公园",
            sourceCn: "太平角公园",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:53" },
                { label: "首车-往青岛站", value: "06:07" },
                { label: "末车-往青岛北站", value: "23:03" },
                { label: "末车-往青岛站-全程", value: "23:22" },
                { label: "末车-往青岛站-终到延安三路", value: "-" }
            ]
        },
        "M0319": {
            cn: "中山公园",
            sourceCn: "中山公园",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:51" },
                { label: "首车-往青岛站", value: "06:09" },
                { label: "末车-往青岛北站", value: "23:01" },
                { label: "末车-往青岛站-全程", value: "23:24" },
                { label: "末车-往青岛站-终到延安三路", value: "-" }
            ]
        },
        "M0320": {
            cn: "汇泉广场",
            sourceCn: "汇泉广场",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:49" },
                { label: "首车-往青岛站", value: "06:11" },
                { label: "末车-往青岛北站", value: "22:59" },
                { label: "末车-往青岛站-全程", value: "23:26" },
                { label: "末车-往青岛站-终到延安三路", value: "-" }
            ]
        },
        "M0321": {
            cn: "人民会堂",
            sourceCn: "人民会堂",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:47" },
                { label: "首车-往青岛站", value: "06:13" },
                { label: "末车-往青岛北站", value: "22:57" },
                { label: "末车-往青岛站-全程", value: "23:28" },
                { label: "末车-往青岛站-终到延安三路", value: "-" }
            ]
        },
        "M0322": {
            cn: "青岛站",
            sourceCn: "青岛站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往青岛北站", value: "05:45" },
                { label: "首车-往青岛站", value: "-" },
                { label: "末车-往青岛北站", value: "22:55" },
                { label: "末车-往青岛站-全程", value: "-" },
                { label: "末车-往青岛站-终到延安三路", value: "-" }
            ]
        }
    },
    "QDM02": {
        "M1108": { url: "https://www.qd-metro.com/operate.php" },
        "M0202": { url: "https://www.qd-metro.com/operate.php" },
        "M0203": { url: "https://www.qd-metro.com/operate.php" },
        "M0204": { url: "https://www.qd-metro.com/operate.php" },
        "M0205": { url: "https://www.qd-metro.com/operate.php" },
        "M0206": { url: "https://www.qd-metro.com/operate.php" },
        "M0207": { url: "https://www.qd-metro.com/operate.php" },
        "M0208": { url: "https://www.qd-metro.com/operate.php" },
        "M0209": {
            cn: "李村公园",
            sourceCn: "李村公园",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "-" },
                { label: "首车-往四川路(轮渡)", value: "05:45" },
                { label: "末车-往李村公园", value: "-" },
                { label: "末车-往四川路(轮渡)", value: "22:55" }
            ]
        },
        "M0305": {
            cn: "李村",
            sourceCn: "李村",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:16" },
                { label: "首车-往四川路(轮渡)", value: "05:47" },
                { label: "末车-往李村公园", value: "23:49" },
                { label: "末车-往四川路(轮渡)", value: "22:57" }
            ]
        },
        "M0211": {
            cn: "枣山路",
            sourceCn: "枣山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:14" },
                { label: "首车-往四川路(轮渡)", value: "05:49" },
                { label: "末车-往李村公园", value: "23:47" },
                { label: "末车-往四川路(轮渡)", value: "22:59" }
            ]
        },
        "M0212": {
            cn: "华楼山路",
            sourceCn: "华楼山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:12" },
                { label: "首车-往四川路(轮渡)", value: "05:50" },
                { label: "末车-往李村公园", value: "23:45" },
                { label: "末车-往四川路(轮渡)", value: "23:00" }
            ]
        },
        "M0213": {
            cn: "东韩",
            sourceCn: "东韩",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:09" },
                { label: "首车-往四川路(轮渡)", value: "05:53" },
                { label: "末车-往李村公园", value: "23:42" },
                { label: "末车-往四川路(轮渡)", value: "23:03" }
            ]
        },
        "M0214": {
            cn: "辽阳东路",
            sourceCn: "辽阳东路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:06" },
                { label: "首车-往四川路(轮渡)", value: "05:56" },
                { label: "末车-往李村公园", value: "23:39" },
                { label: "末车-往四川路(轮渡)", value: "23:06" }
            ]
        },
        "M0215": {
            cn: "同安路",
            sourceCn: "同安路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:05" },
                { label: "首车-往四川路(轮渡)", value: "05:45" },
                { label: "末车-往李村公园", value: "23:38" },
                { label: "末车-往四川路(轮渡)", value: "23:08" }
            ]
        },
        "M0216": {
            cn: "苗岭路",
            sourceCn: "苗岭路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:30" },
                { label: "首车-往四川路(轮渡)", value: "05:47" },
                { label: "末车-往李村公园", value: "23:35" },
                { label: "末车-往四川路(轮渡)", value: "23:11" }
            ]
        },
        "M0217": {
            cn: "石老人浴场",
            sourceCn: "石老人浴场",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:28" },
                { label: "首车-往四川路(轮渡)", value: "05:49" },
                { label: "末车-往李村公园", value: "23:33" },
                { label: "末车-往四川路(轮渡)", value: "23:13" }
            ]
        },
        "M0218": {
            cn: "海安路",
            sourceCn: "海安路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:25" },
                { label: "首车-往四川路(轮渡)", value: "05:52" },
                { label: "末车-往李村公园", value: "23:30" },
                { label: "末车-往四川路(轮渡)", value: "23:15" }
            ]
        },
        "M0219": {
            cn: "海川路",
            sourceCn: "海川路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:23" },
                { label: "首车-往四川路(轮渡)", value: "05:54" },
                { label: "末车-往李村公园", value: "23:28" },
                { label: "末车-往四川路(轮渡)", value: "23:18" }
            ]
        },
        "M0220": {
            cn: "海游路",
            sourceCn: "海游路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:21" },
                { label: "首车-往四川路(轮渡)", value: "05:56" },
                { label: "末车-往李村公园", value: "23:26" },
                { label: "末车-往四川路(轮渡)", value: "23:20" }
            ]
        },
        "M0221": {
            cn: "麦岛",
            sourceCn: "麦岛",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:19" },
                { label: "首车-往四川路(轮渡)", value: "05:58" },
                { label: "末车-往李村公园", value: "23:24" },
                { label: "末车-往四川路(轮渡)", value: "23:22" }
            ]
        },
        "M0222": {
            cn: "高雄路",
            sourceCn: "高雄路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:17" },
                { label: "首车-往四川路(轮渡)", value: "06:00" },
                { label: "末车-往李村公园", value: "23:22" },
                { label: "末车-往四川路(轮渡)", value: "23:24" }
            ]
        },
        "M0223": {
            cn: "青岛中央法务区<br>(燕儿岛路)",
            sourceCn: "燕儿岛路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:15" },
                { label: "首车-往四川路(轮渡)", value: "06:02" },
                { label: "末车-往李村公园", value: "23:20" },
                { label: "末车-往四川路(轮渡)", value: "23:26" }
            ]
        },
        "M0224": {
            cn: "浮山所",
            sourceCn: "浮山所",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:13" },
                { label: "首车-往四川路(轮渡)", value: "06:04" },
                { label: "末车-往李村公园", value: "23:18" },
                { label: "末车-往四川路(轮渡)", value: "23:28" }
            ]
        },
        "M0316": {
            cn: "五四广场",
            sourceCn: "五四广场",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:11" },
                { label: "首车-往四川路(轮渡)", value: "06:06" },
                { label: "末车-往李村公园", value: "23:16" },
                { label: "末车-往四川路(轮渡)", value: "23:30" }
            ]
        },
        "M0226": {
            cn: "芝泉路",
            sourceCn: "芝泉路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:08" },
                { label: "首车-往四川路(轮渡)", value: "06:09" },
                { label: "末车-往李村公园", value: "23:13" },
                { label: "末车-往四川路(轮渡)", value: "23:32" }
            ]
        },
        "M0227": {
            cn: "海信桥",
            sourceCn: "海信桥",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:06" },
                { label: "首车-往四川路(轮渡)", value: "06:12" },
                { label: "末车-往李村公园", value: "23:11" },
                { label: "末车-往四川路(轮渡)", value: "23:35" }
            ]
        },
        "M0228": {
            cn: "台东",
            sourceCn: "台东",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:04" },
                { label: "首车-往四川路(轮渡)", value: "06:14" },
                { label: "末车-往李村公园", value: "23:09" },
                { label: "末车-往四川路(轮渡)", value: "23:37" }
            ]
        },
        "M0229": {
            cn: "利津路",
            sourceCn: "利津路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "06:01" },
                { label: "首车-往四川路(轮渡)", value: "06:16" },
                { label: "末车-往李村公园", value: "23:06" },
                { label: "末车-往四川路(轮渡)", value: "23:39" }
            ]
        },
        "M0230": {
            cn: "泰山路",
            sourceCn: "泰山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "05:59" },
                { label: "首车-往四川路(轮渡)", value: "06:18" },
                { label: "末车-往李村公园", value: "23:04" },
                { label: "末车-往四川路(轮渡)", value: "23:42" }
            ]
        },
        "M0231": {
            cn: "国际邮轮港",
            sourceCn: "国际邮轮港",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "05:57" },
                { label: "首车-往四川路(轮渡)", value: "06:20" },
                { label: "末车-往李村公园", value: "23:02" },
                { label: "末车-往四川路(轮渡)", value: "23:44" }
            ]
        },
        "M0232": {
            cn: "小港",
            sourceCn: "小港",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "05:55" },
                { label: "首车-往四川路(轮渡)", value: "06:22" },
                { label: "末车-往李村公园", value: "23:00" },
                { label: "末车-往四川路(轮渡)", value: "23:46" }
            ]
        },
        "M0233": {
            cn: "四川路(轮渡)",
            sourceCn: "四川路(轮渡)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往李村公园", value: "05:53" },
                { label: "首车-往四川路(轮渡)", value: "-" },
                { label: "末车-往李村公园", value: "22:58" },
                { label: "末车-往四川路(轮渡)", value: "-" }
            ]
        }
    },
    "QDM01": {
        "M0712": {
            cn: "东郭庄",
            sourceCn: "东郭庄",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "-" },
                { label: "首车-往王家港", value: "05:30" },
                { label: "末车-往东郭庄-全程", value: "-" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:03" },
                { label: "末车-往王家港-终到山里", value: "22:45" }
            ]
        },
        "M0713": {
            cn: "沟岔",
            sourceCn: "沟岔",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "06:05" },
                { label: "首车-往王家港", value: "05:32" },
                { label: "末车-往东郭庄-全程", value: "23:59" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:05" },
                { label: "末车-往王家港-终到山里", value: "22:47" }
            ]
        },
        "M0714": {
            cn: "农业大学",
            sourceCn: "农业大学",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "06:03" },
                { label: "首车-往王家港", value: "05:35" },
                { label: "末车-往东郭庄-全程", value: "23:57" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:08" },
                { label: "末车-往王家港-终到山里", value: "22:50" }
            ]
        },
        "M0715": {
            cn: "正阳中路",
            sourceCn: "正阳中路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "06:01" },
                { label: "首车-往王家港", value: "05:37" },
                { label: "末车-往东郭庄-全程", value: "23:55" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:10" },
                { label: "末车-往王家港-终到山里", value: "22:52" }
            ]
        },
        "M0716": {
            cn: "小寨子",
            sourceCn: "小寨子",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:58" },
                { label: "首车-往王家港", value: "05:40" },
                { label: "末车-往东郭庄-全程", value: "23:52" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:13" },
                { label: "末车-往王家港-终到山里", value: "22:55" }
            ]
        },
        "M0717": {
            cn: "凤岗路",
            sourceCn: "凤岗路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:54" },
                { label: "首车-往王家港", value: "05:44" },
                { label: "末车-往东郭庄-全程", value: "23:48" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:17" },
                { label: "末车-往王家港-终到山里", value: "22:59" }
            ]
        },
        "M0718": {
            cn: "流亭",
            sourceCn: "流亭",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:51" },
                { label: "首车-往王家港", value: "05:47" },
                { label: "末车-往东郭庄-全程", value: "23:45" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:20" },
                { label: "末车-往王家港-终到山里", value: "23:02" }
            ]
        },
        "M0719": {
            cn: "仙家寨(汽车北站)",
            sourceCn: "仙家寨(汽车北站)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:47" },
                { label: "首车-往王家港", value: "05:50" },
                { label: "末车-往东郭庄-全程", value: "23:41" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:23" },
                { label: "末车-往王家港-终到山里", value: "23:05" }
            ]
        },
        "M0720": {
            cn: "瑞金路",
            sourceCn: "瑞金路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:45" },
                { label: "首车-往王家港", value: "05:30" },
                { label: "末车-往东郭庄-全程", value: "23:39" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:26" },
                { label: "末车-往王家港-终到山里", value: "23:08" }
            ]
        },
        "M0721": {
            cn: "遵义路",
            sourceCn: "遵义路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:42" },
                { label: "首车-往王家港", value: "05:32" },
                { label: "末车-往东郭庄-全程", value: "23:36" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:28" },
                { label: "末车-往王家港-终到山里", value: "23:10" }
            ]
        },
        "M0722": {
            cn: "南岭",
            sourceCn: "南岭",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:40" },
                { label: "首车-往王家港", value: "05:34" },
                { label: "末车-往东郭庄-全程", value: "23:34" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:31" },
                { label: "末车-往王家港-终到山里", value: "23:13" }
            ]
        },
        "M0112": {
            cn: "兴国路",
            sourceCn: "兴国路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:38" },
                { label: "首车-往王家港", value: "05:37" },
                { label: "末车-往东郭庄-全程", value: "23:32" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:33" },
                { label: "末车-往王家港-终到山里", value: "23:15" }
            ]
        },
        "M0113": {
            cn: "永年路",
            sourceCn: "永年路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:35" },
                { label: "首车-往王家港", value: "05:39" },
                { label: "末车-往东郭庄-全程", value: "23:29" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:36" },
                { label: "末车-往王家港-终到山里", value: "23:18" }
            ]
        },
        "M0114": {
            cn: "沧安路",
            sourceCn: "沧安路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:32" },
                { label: "首车-往王家港", value: "05:42" },
                { label: "末车-往东郭庄-全程", value: "23:26" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:39" },
                { label: "末车-往王家港-终到山里", value: "23:21" }
            ]
        },
        "M0301": {
            cn: "青岛北站",
            sourceCn: "青岛北站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:30" },
                { label: "首车-往王家港", value: "05:30" },
                { label: "末车-往东郭庄-全程", value: "23:24" },
                { label: "末车-往东郭庄-终到青岛北站", value: "-" },
                { label: "末车-往王家港-全程", value: "22:41" },
                { label: "末车-往王家港-终到山里", value: "23:23" }
            ]
        },
        "M0116": {
            cn: "安顺路",
            sourceCn: "安顺路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:57" },
                { label: "首车-往王家港", value: "05:32" },
                { label: "末车-往东郭庄-全程", value: "23:21" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:38" },
                { label: "末车-往王家港-全程", value: "22:43" },
                { label: "末车-往王家港-终到山里", value: "23:25" }
            ]
        },
        "M0117": {
            cn: "胜利桥(纺织谷)",
            sourceCn: "胜利桥(纺织谷)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:55" },
                { label: "首车-往王家港", value: "05:34" },
                { label: "末车-往东郭庄-全程", value: "23:19" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:36" },
                { label: "末车-往王家港-全程", value: "22:46" },
                { label: "末车-往王家港-终到山里", value: "23:28" }
            ]
        },
        "M0118": {
            cn: "中心医院",
            sourceCn: "中心医院",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:53" },
                { label: "首车-往王家港", value: "05:36" },
                { label: "末车-往东郭庄-全程", value: "23:17" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:34" },
                { label: "末车-往王家港-全程", value: "22:48" },
                { label: "末车-往王家港-终到山里", value: "23:30" }
            ]
        },
        "M0119": {
            cn: "水清沟",
            sourceCn: "水清沟",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:50" },
                { label: "首车-往王家港", value: "05:39" },
                { label: "末车-往东郭庄-全程", value: "23:14" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:31" },
                { label: "末车-往王家港-全程", value: "22:51" },
                { label: "末车-往王家港-终到山里", value: "23:33" }
            ]
        },
        "M0120": {
            cn: "北岭",
            sourceCn: "北岭",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:47" },
                { label: "首车-往王家港", value: "05:42" },
                { label: "末车-往东郭庄-全程", value: "23:11" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:28" },
                { label: "末车-往王家港-全程", value: "22:54" },
                { label: "末车-往王家港-终到山里", value: "23:36" }
            ]
        },
        "M0121": {
            cn: "小村庄",
            sourceCn: "小村庄",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:45" },
                { label: "首车-往王家港", value: "05:44" },
                { label: "末车-往东郭庄-全程", value: "23:09" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:26" },
                { label: "末车-往王家港-全程", value: "22:56" },
                { label: "末车-往王家港-终到山里", value: "23:38" }
            ]
        },
        "M0122": {
            cn: "海泊桥(海慈医疗)",
            sourceCn: "海泊桥(海慈医疗)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:42" },
                { label: "首车-往王家港", value: "05:48" },
                { label: "末车-往东郭庄-全程", value: "23:06" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:23" },
                { label: "末车-往王家港-全程", value: "23:00" },
                { label: "末车-往王家港-终到山里", value: "23:42" }
            ]
        },
        "M0228": {
            cn: "台东",
            sourceCn: "台东",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:39" },
                { label: "首车-往王家港", value: "05:50" },
                { label: "末车-往东郭庄-全程", value: "23:03" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:20" },
                { label: "末车-往王家港-全程", value: "23:02" },
                { label: "末车-往王家港-终到山里", value: "23:44" }
            ]
        },
        "M0124": {
            cn: "广饶路",
            sourceCn: "广饶路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:36" },
                { label: "首车-往王家港", value: "05:53" },
                { label: "末车-往东郭庄-全程", value: "23:00" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:17" },
                { label: "末车-往王家港-全程", value: "23:05" },
                { label: "末车-往王家港-终到山里", value: "23:47" }
            ]
        },
        "M0125": {
            cn: "观象山(市立医院)",
            sourceCn: "观象山(市立医院)",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:34" },
                { label: "首车-往王家港", value: "05:55" },
                { label: "末车-往东郭庄-全程", value: "22:58" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:15" },
                { label: "末车-往王家港-全程", value: "23:07" },
                { label: "末车-往王家港-终到山里", value: "23:49" }
            ]
        },
        "M0126": {
            cn: "中山路",
            sourceCn: "中山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:32" },
                { label: "首车-往王家港", value: "05:57" },
                { label: "末车-往东郭庄-全程", value: "22:56" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:13" },
                { label: "末车-往王家港-全程", value: "23:09" },
                { label: "末车-往王家港-终到山里", value: "23:51" }
            ]
        },
        "M0322": {
            cn: "青岛站",
            sourceCn: "青岛站",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:30" },
                { label: "首车-往王家港", value: "05:30" },
                { label: "末车-往东郭庄-全程", value: "22:53" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:10" },
                { label: "末车-往王家港-全程", value: "23:12" },
                { label: "末车-往王家港-终到山里", value: "23:54" }
            ]
        },
        "M0128": {
            cn: "西镇",
            sourceCn: "西镇",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "06:03" },
                { label: "首车-往王家港", value: "05:32" },
                { label: "末车-往东郭庄-全程", value: "22:51" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:08" },
                { label: "末车-往王家港-全程", value: "23:14" },
                { label: "末车-往王家港-终到山里", value: "23:56" }
            ]
        },
        "M0129": {
            cn: "团岛",
            sourceCn: "团岛",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "06:01" },
                { label: "首车-往王家港", value: "05:34" },
                { label: "末车-往东郭庄-全程", value: "22:49" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:06" },
                { label: "末车-往王家港-全程", value: "23:16" },
                { label: "末车-往王家港-终到山里", value: "23:58" }
            ]
        },
        "M0130": {
            cn: "凤凰岛",
            sourceCn: "凤凰岛",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:55" },
                { label: "首车-往王家港", value: "05:39" },
                { label: "末车-往东郭庄-全程", value: "22:43" },
                { label: "末车-往东郭庄-终到青岛北站", value: "23:00" },
                { label: "末车-往王家港-全程", value: "23:22" },
                { label: "末车-往王家港-终到山里", value: "次日00:04" }
            ]
        },
        "M0131": {
            cn: "山里",
            sourceCn: "山里",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:52" },
                { label: "首车-往王家港", value: "05:42" },
                { label: "末车-往东郭庄-全程", value: "22:40" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:57" },
                { label: "末车-往王家港-全程", value: "23:24" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0132": {
            cn: "南北屯",
            sourceCn: "南北屯",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:49" },
                { label: "首车-往王家港", value: "05:45" },
                { label: "末车-往东郭庄-全程", value: "22:37" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:54" },
                { label: "末车-往王家港-全程", value: "23:27" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0133": {
            cn: "新港山路",
            sourceCn: "新港山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:47" },
                { label: "首车-往王家港", value: "05:48" },
                { label: "末车-往东郭庄-全程", value: "22:35" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:52" },
                { label: "末车-往王家港-全程", value: "23:30" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0134": {
            cn: "安子",
            sourceCn: "安子",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:44" },
                { label: "首车-往王家港", value: "05:50" },
                { label: "末车-往东郭庄-全程", value: "22:32" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:49" },
                { label: "末车-往王家港-全程", value: "23:32" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0135": {
            cn: "天目山路",
            sourceCn: "天目山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:42" },
                { label: "首车-往王家港", value: "05:52" },
                { label: "末车-往东郭庄-全程", value: "22:30" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:47" },
                { label: "末车-往王家港-全程", value: "23:34" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0136": {
            cn: "薛家岛",
            sourceCn: "薛家岛",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:40" },
                { label: "首车-往王家港", value: "05:54" },
                { label: "末车-往东郭庄-全程", value: "22:28" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:45" },
                { label: "末车-往王家港-全程", value: "23:36" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0137": {
            cn: "丁家河",
            sourceCn: "丁家河",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:38" },
                { label: "首车-往王家港", value: "05:57" },
                { label: "末车-往东郭庄-全程", value: "22:26" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:43" },
                { label: "末车-往王家港-全程", value: "23:39" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M1303": {
            cn: "井冈山路",
            sourceCn: "井冈山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:35" },
                { label: "首车-往王家港", value: "05:59" },
                { label: "末车-往东郭庄-全程", value: "22:23" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:40" },
                { label: "末车-往王家港-全程", value: "23:41" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0139": {
            cn: "太行山路",
            sourceCn: "太行山路",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:33" },
                { label: "首车-往王家港", value: "06:01" },
                { label: "末车-往东郭庄-全程", value: "22:21" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:38" },
                { label: "末车-往王家港-全程", value: "23:43" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0140": {
            cn: "石油大学",
            sourceCn: "石油大学",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:31" },
                { label: "首车-往王家港", value: "06:03" },
                { label: "末车-往东郭庄-全程", value: "22:19" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:36" },
                { label: "末车-往王家港-全程", value: "23:45" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        },
        "M0141": {
            cn: "王家港",
            sourceCn: "王家港",
            url: "https://www.qd-metro.com/operate.php",
            source: "青岛地铁首末班车时刻表(用户提供)",
            items: [
                { label: "首车-往东郭庄", value: "05:30" },
                { label: "首车-往王家港", value: "-" },
                { label: "末车-往东郭庄-全程", value: "22:18" },
                { label: "末车-往东郭庄-终到青岛北站", value: "22:35" },
                { label: "末车-往王家港-全程", value: "-" },
                { label: "末车-往王家港-终到山里", value: "-" }
            ]
        }
    }
};
