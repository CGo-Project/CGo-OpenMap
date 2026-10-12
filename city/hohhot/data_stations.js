/**
 * CGo OpenMap - 呼和浩特车站数据 (city/hohhot/data_stations.js)
 *
 * 站序与站名以呼和浩特地铁官网「交互线路图」为准（https://hhhtmetro.com/hsdt/toXlzs）：
 *   1 号线 20 站（伊利健康谷 → 坝堰（机场））；
 *   2 号线 24 站（塔利东路 → 阿尔山路）；新华广场为两线换乘站（共用同一 ID 与坐标）。
 *
 * 【坐标口径】本图为示意图排布，坐标按下列排版规则推算，不代表地理坐标或真实站间里程：
 *
 *  1 号线（沿 y = 360 一字排开，站距 60）：
 *    新华广场 x = 500，自西向东每站 +60，
 *    伊利健康谷 x = 80 … 坝堰（机场）x = 1220；
 *    站名标签按偶数站（0 起）正上、奇数站正下交替，新华广场例外，置于右下角。
 *
 *  2 号线分三段：
 *    · 北段东西向（y = 80，10 站等分 60）：
 *      西端内蒙古体育馆横向对齐 1 号线人民会堂（x = 560），
 *      东端塔利东路横向对齐 1 号线什兰岱（x = 1100）；
 *      标签自西向东正上 / 正下交替。
 *    · 中间南北向（x = 500，纵向 60，新华广场两侧各 100）：
 *      自呼和浩特体育场（y = 140）依次向南，公主府 200、呼和浩特站 260、
 *      新华广场 360、中山路 460、大学西街 520、诺和木勒 580、水上公园 640、
 *      五里营 700、锡林公园 760、内大南校区 820；标签统一排在左侧。
 *    · 南段东西向（y = 880，3 站等分 60）：
 *      帅家营横向对齐内蒙古体育馆（x = 560），阿尔山路横向对齐毫沁营（x = 680）；
 *      标签自西向东正下 / 正上交替。
 *
 * 车站字段约定：
 * - type: "dot" 普通站，"tsf" 换乘站，"rdot" 国铁车站
 * - x / y: 画布坐标（左上角为原点 0,0）
 * - cn / en: 中文站名与英文站名（英文名以官方线网图的英文标注为准，见下方校对说明）
 * - mn: 传统蒙古文站名（胡都木文，竖排）
 * - align: "top" | "bottom" | "left" | "top-right" | "bottom-right" 等
 *
 * 国铁车站（type "rdot"，与同名地铁站同址）：
 *   呼和浩特站 NHC ↔ 地铁 2 号线 M213；呼和浩特东站 NDC ↔ 地铁 1 号线 M116。
 *   两者坐标完全重合，国铁站仅落铁路徽标（hideLabel），站名与标签由同名地铁站承担；
 *   两者分属国铁与地铁两套票务系统，出站换乘需重新购票，见 data_virtual_transfers.js。
 *   归属线路为 data_lines.js 中的「中国铁路」点状条目（isPointOnly）。
 *
 * 【已按官方线网图截图校对（主理人提供，2026-10-04）】
 * 中文站名 43/43 与官方一致（并再次确认三处现行名：呼钢南路、北山公园、丝绸之路大道）。
 * 英文名遵循官方图的排版口径：**拼音音译部分全大写**、英文意译部分保持正常大小写
 * （如 YILI Health Valley / XINHUA Square / BEISHAN Park / SHUISHANG Park）。
 * 仅一处不照抄：大学西街官方图作 DAXUEJIE，系漏拼了「西」，按正确拼音记作 DAXUEXIJIE。
 * 蒙文：官方**线网图原图**分辨率是截图的一倍以上（6743×4735），可逐站放大核对，出处：
 *   https://hhhtmetro.com/other/dtxwt 页面背景图 →
 *   https://hhhtmetro.com/UploadModule/uploads/hsdt/2024/06/07/095668.jpg
 *   （注：官方交互图 /hsdt/toXlzs 的站名由 JS 绘制、**不含**蒙文；蒙文只在这张静态线网图里。）
 * 已按该原图放大 2~4 倍抽查，结论：
 *   - 官方是**空格分词**（公主府 ᠭᠦᠩᠵᠤ | ᠶᠢᠨ | ᠣᠷᠳᠣᠨ 三簇之间有明确空隙），
 *     此前「属格助词与前置词连写」的猜测不成立；
 *   - 逐站**列数**（官方每词一列、自左向右竖排，与本实现排法一致）复核：
 *     新华广场 2、公主府 3、将军衙署 3、呼和浩特体育场 5、内蒙古体育馆 6、呼和浩特站 6
 *     —— 均与本文件一致；内蒙古体育馆那 6 列含首词 ᠥᠪᠥᠷ，印证了对维基漏字的补全；
 *   - 将军衙署的属格助词官方作**单字母** ᠤ（孤字形态带圈，肉眼近似日文「の」），而非 ᠤᠨ：
 *     蒙文语法上词干以 -n 结尾时属格取 -u/-ü 且词干末 n 脱落（jangjun → jangjun-u），
 *     故维基原写法正确；曾据「中列高≈30px」误判为两个字母，已回退。
 *     同理呼和浩特站的 tergen 也取 ᠦ（非 ᠦᠨ）。
 *   - 字形差异：实测本机命中的是系统字体 **Mongolian Baiti**（`document.fonts.check` = true；
 *     CDN 的 Noto Sans Mongolian 已加载但不生效），与官方印刷体同族 —— 故「长得不一样」
 *     主要来自**竖向压缩**（被点名的 9 站正是蒙文最长、压缩最重的那批），而非字体或拼写。
 *   - 逐字拼写仍未独立验证：官方原图按 1.8~3 倍放大裁出的切片放在 `_mn_review/`，
 *     待有蒙文读写能力的人对照；本地实现不再凭空改动拼写（猜写等于编造数据）。
 *
 * ⚠️【mn 字段来源与待校对处】
 * 本字段为二手整理，来源两处：
 *   A = 英文维基百科 Line 1 / Line 2 (Hohhot Metro) 条目的 Mongolian name 列；
 *   B = MetroDreamin'「呼和浩特地铁 Hohhot Metro」社区图（作者 CSG）。
 * 两来源在 38 站上完全一致，差异集中在**改过名的站**，本文件一律按**现行站名**取词，
 * 具体存疑处见各站行内注释：
 *   - 呼钢南路：维基记的是旧名「呼钢东路」＋ᠵᠡᠭᠦᠨ（东）；此处按现行名取「南」（B）。
 *   - 北山公园：维基 / 百科记的是旧名「新城图书馆」；此处按现行名取词（B）。
 *   - 丝绸之路大道：维基 / 百科记的是旧名「东二环路」；此处按现行名取词（B）。
 *   - 内蒙古体育馆：维基漏首词 ᠥᠪᠥᠷ，此处按 B 补全。
 *   - 北山公园的「公园」：B 作 ᠴᠡᠴᠡᠷᠯᠵᠭ，与其余三站「公园」（ᠴᠡᠴᠡᠷᠯᠢᠭ）不一致，
 *     疑为笔误，此处统一为 ᠴᠡᠴᠡᠷᠯᠢᠭ。
 *   - 孔家营 / 东影路 / 新店 / 百合路 / 中山路 / 五里营 6 站疑为汉字音译，真实站牌可能另有写法。
 * 三条改名的官方出处：集团公告「注意！名称有变！呼和浩特地铁这三座车站更名啦！」
 * （2023-10-25，2023-11-01 生效）：呼钢东路→呼钢南路、新城图书馆→北山公园、东二环路→丝绸之路大道。
 */

const stationsData = {
    // ===== 1号线（伊利健康谷 → 坝堰（机场））=====
    "M101": {
        type: "dot",
        x: 80,
        y: 360,
        cn: "伊利健康谷",
        en: "YILI Health Valley",
        mn: "ᠢᠯᠢ ᠡᠷᠡᠭᠦᠯ ᠮᠡᠨᠳᠦ ᠶᠢᠨ ᠵᠢᠯᠠᠭ᠎ᠠ",
        align: "top"
    },
    "M102": {
        type: "dot",
        x: 140,
        y: 360,
        cn: "西二环路",
        en: "XI'ERHUANLU",
        mn: "ᠪᠠᠷᠠᠭᠤᠨ ᠬᠣᠶᠠᠳᠤᠭᠠᠷ ᠲᠣᠭᠣᠷᠢᠭ ᠵᠠᠮ",
        align: "bottom"
    },
    "M103": {
        type: "dot",
        x: 200,
        y: 360,
        cn: "孔家营",
        en: "KONGJIAYING",
        mn: "ᠺᠦᠩ ᠵᠢᠶᠠ ᠶᠢᠩ",
        align: "top"
    },
    "M104": {
        type: "dot",
        x: 260,
        y: 360,
        cn: "呼钢南路",
        en: "HUGANGNANLU",
        // 旧名「呼钢东路」的蒙文作 …ᠵᠡᠭᠦᠨ ᠵᠠᠮ（东），此处按现行名取「南」
        mn: "ᠬᠥᠬᠡᠬᠣᠲᠠ ᠶᠢᠨ ᠪᠣᠯᠣᠳ ᠲᠡᠮᠦᠷ ᠦ᠋ᠨ ᠡᠮᠦᠨ᠎ᠡ ᠵᠠᠮ",
        align: "bottom"
    },
    "M105": {
        type: "dot",
        x: 320,
        y: 360,
        cn: "西龙王庙",
        en: "XILONGWANGMIAO",
        mn: "ᠪᠠᠷᠠᠭᠤᠨ ᠯᠤᠤᠰ ᠤᠨ ᠰᠦᠮ᠎ᠡ",
        align: "top"
    },
    "M106": {
        type: "dot",
        x: 380,
        y: 360,
        cn: "乌兰夫纪念馆",
        en: "WULANFU Memorial Hall",
        mn: "ᠤᠯᠠᠭᠠᠨᠬᠦᠦ ᠶᠢᠨ ᠳᠤᠷᠠᠰᠬᠠᠯ ᠤᠨ ᠣᠷᠳᠣᠨ",
        align: "bottom"
    },
    "M107": {
        type: "dot",
        x: 440,
        y: 360,
        cn: "附属医院",
        en: "Affiliated Hospital",
        mn: "ᠬᠠᠷᠢᠶᠠᠲᠤ ᠡᠮᠨᠡᠯᠭᠡ ᠶᠢᠨ ᠬᠣᠷᠢᠶ᠎ᠠ",
        align: "top"
    },
    // 1 / 2 号线换乘站：两线共用同一 ID 与坐标
    "M108": {
        type: "tsf",
        x: 500,
        y: 360,
        cn: "新华广场",
        en: "XINHUA Square",
        mn: "ᠰᠢᠨᠬᠤᠸᠠ ᠲᠠᠯᠠᠪᠠᠢ",
        align: "bottom-right"
    },
    "M109": {
        type: "dot",
        x: 560,
        y: 360,
        cn: "人民会堂",
        en: "People's Hall",
        mn: "ᠠᠷᠠᠳ ᠤᠨ ᠬᠤᠷᠠᠯ ᠤᠨ ᠲᠠᠩᠬᠢᠮ",
        align: "top"
    },
    "M110": {
        type: "dot",
        x: 620,
        y: 360,
        cn: "将军衙署",
        en: "JIANGJUNYASHU",
        mn: "ᠵᠠᠩᠵᠤᠨ ᠤ ᠶᠠᠮᠤᠨ",
        align: "bottom"
    },
    "M111": {
        type: "dot",
        x: 680,
        y: 360,
        cn: "艺术学院",
        en: "Arts College",
        mn: "ᠤᠷᠠᠯᠢᠭ ᠤᠨ ᠳᠡᠭᠡᠳᠦ ᠰᠤᠷᠭᠠᠭᠤᠯᠢ",
        align: "top"
    },
    "M112": {
        type: "dot",
        x: 740,
        y: 360,
        cn: "东影路",
        en: "DONGYINGLU",
        mn: "ᠳ᠋ᠦᠩ ᠶᠢᠩ ᠵᠠᠮ",
        align: "bottom"
    },
    "M113": {
        type: "dot",
        x: 800,
        y: 360,
        cn: "内蒙古展览馆",
        en: "Inner Mongolia Exhibition Hall",
        mn: "ᠥᠪᠥᠷ ᠮᠣᠩᠭᠣᠯ ᠤᠨ ᠦᠵᠡᠰᠬᠦᠯᠡᠩ ᠦᠨ ᠣᠷᠳᠣᠨ",
        align: "top"
    },
    "M114": {
        type: "dot",
        x: 860,
        y: 360,
        cn: "内蒙古博物院",
        en: "Inner Mongolia Museum",
        mn: "ᠥᠪᠥᠷ ᠮᠣᠩᠭᠣᠯ ᠤᠨ ᠮᠦᠽᠧᠢ",
        align: "bottom"
    },
    "M115": {
        type: "dot",
        x: 920,
        y: 360,
        cn: "市政府",
        en: "City Government",
        mn: "ᠬᠣᠲᠠ ᠶᠢᠨ ᠵᠠᠰᠠᠭ ᠤᠨ ᠣᠷᠳᠣᠨ",
        align: "top"
    },
    "M116": {
        type: "dot",
        x: 980,
        y: 360,
        cn: "呼和浩特东站",
        en: "Hohhot East Railway Station",
        mn: "ᠬᠥᠬᠡᠬᠣᠲᠠ ᠶᠢᠨ ᠵᠡᠭᠦᠨ ᠥᠷᠲᠡᠭᠡ",
        align: "bottom"
    },
    "M117": {
        type: "dot",
        x: 1040,
        y: 360,
        cn: "后不塔气",
        en: "HOUBUTAQI",
        mn: "ᠬᠣᠢᠲᠤ ᠪᠤᠲᠠᠴᠢ",
        align: "top"
    },
    "M118": {
        type: "dot",
        x: 1100,
        y: 360,
        cn: "什兰岱",
        en: "SHILANDAI",
        mn: "ᠰᠢᠯᠠᠷᠳᠠᠢ",
        align: "bottom"
    },
    "M119": {
        type: "dot",
        x: 1160,
        y: 360,
        cn: "白塔西",
        en: "BAITA West",
        mn: "ᠴᠠᠭᠠᠨ ᠰᠤᠪᠤᠷᠭ᠎ᠠ ᠶᠢᠨ ᠪᠠᠷᠠᠭᠤᠨ",
        align: "top"
    },
    "M120": {
        type: "dot",
        x: 1220,
        y: 360,
        cn: "坝堰（机场）",
        en: "BAYAN(Airport)",
        mn: "ᠪᠠᠶᠠᠨ (ᠨᠢᠰᠬᠡᠯ ᠦᠨ ᠪᠠᠭᠤᠳᠠᠯ)",
        align: "bottom"
    },

    // ===== 2号线 · 北段东西向（对齐 1 号线）=====
    "M210": {
        type: "dot",
        x: 560,
        y: 80,
        cn: "内蒙古体育馆",
        en: "Inner Mongolia Gymnasium",
        // 维基漏首词 ᠥᠪᠥᠷ，此处补全
        mn: "ᠥᠪᠥᠷ ᠮᠣᠩᠭᠣᠯ ᠤᠨ ᠲᠠᠮᠢᠷ ᠤᠨ ᠣᠷᠳᠣᠨ",
        align: "top"
    },
    "M209": {
        type: "dot",
        x: 620,
        y: 80,
        cn: "成吉思汗广场",
        en: "Genghis Khan Square",
        mn: "ᠴᠢᠩᠭᠢᠰ ᠬᠠᠭᠠᠨ ᠲᠠᠯᠠᠪᠠᠢ",
        align: "bottom"
    },
    "M208": {
        type: "dot",
        x: 680,
        y: 80,
        cn: "毫沁营",
        en: "HAOQINYING",
        mn: "ᠬᠠᠭᠤᠴᠢᠨ ᠠᠢᠯ",
        align: "top"
    },
    "M207": {
        type: "dot",
        x: 740,
        y: 80,
        cn: "成吉思汗公园",
        en: "Genghis Khan Park",
        mn: "ᠴᠢᠩᠭᠢᠰ ᠬᠠᠭᠠᠨ ᠴᠡᠴᠡᠷᠯᠢᠭ",
        align: "bottom"
    },
    "M206": {
        type: "dot",
        x: 800,
        y: 80,
        cn: "一家村",
        en: "YIJIACUN",
        mn: "ᠭᠠᠭᠴᠠ ᠭᠡᠷ ᠲᠣᠰᠬᠣᠨ",
        align: "top"
    },
    "M205": {
        type: "dot",
        x: 860,
        y: 80,
        cn: "丝绸之路大道",
        en: "SICHOUZHILUDADAO",
        // 旧名「新城图书馆」的蒙文作 ᠰᠢᠨ᠎ᠡ ᠬᠣᠲᠠ ᠶᠢᠨ ᠨᠣᠮ ᠤᠨ ᠰᠠᠩ，此处按现行名取词
        mn: "ᠲᠣᠷᠭᠠᠨ ᠵᠠᠮ",
        align: "bottom"
    },
    "M204": {
        type: "dot",
        x: 920,
        y: 80,
        cn: "北山公园",
        en: "BEISHAN Park",
        // 旧名「东二环路」的蒙文作 ᠵᠡᠭᠦᠨ ᠬᠣᠶᠠᠳᠤᠭᠠᠷ ᠲᠣᠭᠣᠷᠢᠭ ᠵᠠᠮ，此处按现行名取词
        mn: "ᠬᠣᠢᠲᠤ ᠠᠭᠤᠯᠠ ᠴᠡᠴᠡᠷᠯᠢᠭ",
        align: "top"
    },
    "M203": {
        type: "dot",
        x: 980,
        y: 80,
        cn: "百合路",
        en: "BAIHELU",
        mn: "ᠪᠠᠢ ᠾᠧ ᠵᠠᠮ",
        align: "bottom"
    },
    "M202": {
        type: "dot",
        x: 1040,
        y: 80,
        cn: "新店",
        en: "XINDIAN",
        mn: "ᠰᠢᠨ ᠳ᠋ᠢᠶᠠᠨ",
        align: "top"
    },
    "M201": {
        type: "dot",
        x: 1100,
        y: 80,
        cn: "塔利东路",
        en: "TALIDONGLU",
        mn: "ᠲᠠᠪᠤᠨ ᠲᠣᠯᠣᠭᠠᠢ ᠵᠡᠭᠦᠨ ᠵᠠᠮ",
        align: "bottom"
    },

    // ===== 2号线 · 中间南北向（标签统一在左）=====
    "M211": {
        type: "dot",
        x: 500,
        y: 140,
        cn: "呼和浩特体育场",
        en: "Hohhot Stadium",
        mn: "ᠬᠥᠬᠡᠬᠣᠲᠠ ᠶᠢᠨ ᠲᠠᠮᠢᠷ ᠤᠨ ᠲᠠᠯᠠᠪᠠᠢ",
        align: "left"
    },
    "M212": {
        type: "dot",
        x: 500,
        y: 200,
        cn: "公主府",
        en: "GONGZHUFU",
        mn: "ᠭᠦᠩᠵᠦ ᠶᠢᠨ ᠣᠷᠳᠣᠨ",
        align: "left"
    },
    "M213": {
        type: "dot",
        x: 500,
        y: 260,
        cn: "呼和浩特站",
        en: "Hohhot Railway Station",
        mn: "ᠬᠥᠬᠡᠬᠣᠲᠠ ᠶᠢᠨ ᠭᠠᠯᠲᠤ ᠲᠡᠷᠭᠡᠨ ᠦ ᠥᠷᠲᠡᠭᠡ",
        align: "left"
    },
    "M214": {
        type: "dot",
        x: 500,
        y: 460,
        cn: "中山路",
        en: "ZHONGSHANLU",
        mn: "ᠵᠦᠩᠱᠠᠨ ᠵᠠᠮ",
        align: "left"
    },
    "M215": {
        type: "dot",
        x: 500,
        y: 520,
        cn: "大学西街",
        en: "DAXUEXIJIE",
        mn: "ᠶᠡᠬᠡ ᠰᠤᠷᠭᠠᠭᠤᠯᠢ ᠪᠠᠷᠠᠭᠤᠨ ᠵᠡᠭᠡᠯᠢ",
        align: "left"
    },
    "M216": {
        type: "dot",
        x: 500,
        y: 580,
        cn: "诺和木勒",
        en: "NUOHEMULE",
        mn: "ᠨᠡᠬᠮᠡᠯ",
        align: "left"
    },
    "M217": {
        type: "dot",
        x: 500,
        y: 640,
        cn: "水上公园",
        en: "SHUISHANG Park",
        mn: "ᠤᠰᠤᠨ ᠳᠡᠭᠡᠷᠡᠬᠢ ᠴᠡᠴᠡᠷᠯᠢᠭ",
        align: "left"
    },
    "M218": {
        type: "dot",
        x: 500,
        y: 700,
        cn: "五里营",
        en: "WULIYING",
        mn: "ᠦ᠋ ᠯᠢ ᠶᠢᠩ",
        align: "left"
    },
    "M219": {
        type: "dot",
        x: 500,
        y: 760,
        cn: "锡林公园",
        en: "XILIN Park",
        mn: "ᠰᠢᠯᠢ ᠶᠢᠨ ᠴᠡᠴᠡᠷᠯᠢᠭ",
        align: "left"
    },
    "M220": {
        type: "dot",
        x: 500,
        y: 820,
        cn: "内大南校区",
        en: "NEIDA NANXIAOQU",
        mn: "ᠥᠪᠥᠷ ᠮᠣᠩᠭᠣᠯ ᠤᠨ ᠶᠡᠬᠡ ᠰᠤᠷᠭᠠᠭᠤᠯᠢ ᠶᠢᠨ ᠡᠮᠦᠨ᠎ᠡ ᠲᠣᠭᠣᠷᠢᠭ",
        align: "left"
    },

    // ===== 2号线 · 南段东西向（对齐北段）=====
    "M221": {
        type: "dot",
        x: 560,
        y: 880,
        cn: "帅家营",
        en: "SHUAIJIAYING",
        mn: "ᠱᠤᠸᠠᠢ ᠣᠪᠣᠭᠲᠤ ᠠᠢᠯ",
        align: "bottom"
    },
    "M222": {
        type: "dot",
        x: 620,
        y: 880,
        cn: "喇嘛营",
        en: "LAMAYING",
        mn: "ᠯᠠᠮᠠ ᠶᠢᠨ ᠠᠢᠯ",
        align: "top"
    },
    "M223": {
        type: "dot",
        x: 680,
        y: 880,
        cn: "阿尔山路",
        en: "A'ERSHANLU",
        mn: "ᠷᠠᠰᠢᠶᠠᠨ ᠵᠠᠮ",
        align: "bottom"
    },

    // ===== 国铁车站（rdot，与同名地铁站同址）=====
    // 数据格式参照哈尔滨：仅落铁路徽标、hideLabel，站名与标签由同名地铁站承担；
    // 归属线路为 data_lines.js 中的「中国铁路」点状条目（isPointOnly）。
    "NHC": {
        type: "rdot",
        x: 500,
        y: 260,
        cn: "呼和浩特站",
        en: "Hohhot Railway Station",
        align: "top",
        hideLabel: true,
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "NDC": {
        type: "rdot",
        x: 980,
        y: 360,
        cn: "呼和浩特东站",
        en: "Hohhot East Railway Station",
        align: "top",
        hideLabel: true,
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    }
};
