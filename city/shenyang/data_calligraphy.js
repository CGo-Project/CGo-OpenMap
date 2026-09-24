/**
 * CGo OpenMap - 沈阳地铁站名题字数据
 *
 * 仅收录经实拍核实、由名人或书法家题写站名的车站，按车站 ID 索引
 * （与 data_stations.js 的 key 一致）。
 *
 * 字段说明
 *   image       题字横图路径（站点根相对 URL，如 ./city/shenyang/assets/...）。
 *               素材要求：黑底白字高对比图（PNG/JPEG），展示时经 CSS luminance
 *               蒙版将黑底褪为透明、字迹着色为当前标题栏文字色，
 *               亮 / 暗主题自动切换并保留飞白浓淡。
 *               **留空表示该站暂无题字横图**（如 2 号线，官方只公布了题写者
 *               简介、未公布题字），此时标题栏保持普通文字站名，
 *               仅在车站信息页签显示题写者简介卡片
 *   ratio       图片原始宽高比 (width / height)，供标题栏等比排版（有 image 时必填）
 *   alt         无障碍题名，同时作为吸附侧栏标题文本来源（有 image 时必填）
 *   inscribedOldName    题字写的是车站旧名时填写（如人民广场站的题字写的是
 *                       「市府广场」）。填写后信息页卡片的引导句改为
 *                       「本站旧名“XX”由 YY 题写。」，避免与当前站名对不上；
 *                       未填写时沿用「本站站名由 YY 题写。」
 *   calligrapher.name   题字人姓名
 *   calligrapher.intro  生平简介完整句（含姓名主语，可信 HTML）；
 *                       卡片引导句为「本站站名由 XX 题写。」，
 *                       intro 必须自带主语，避免出现「男，生于……」式残句
 *   pendingCalligrapher 占位标记：**题字实物已确证、题写者尚未考证出来**时填 true。
 *                       收录依据仅为「该站站内确有题字墙 / 题字实物」这一事实，
 *                       展示端据此在车站信息页签显示「题写者待考」说明卡片；
 *                       因无题字横图，不接管标题栏（标题栏保持普通文字站名）。
 *                       日后考证出题写者，以 image / calligrapher 替换本字段即可。
 *
 * 生平文案来源
 *   - 2 号线：沈阳地铁官网 images/to_2/jpg/ 下各站题写者简介页原文。当年站内题字
 *     旁曾设说明牌 / 说明二维码指向该图集，近年已陆续拆除，故以官网存档为准；
 *   - 1 号线主线：站内题字墙落款辨认 + 公开资料（中国书协、地方书协职务），
 *     并与沈阳地铁官网《沈阳地铁五年成长志（四）文化地铁五年行》(2015) 的官方口径
 *     （「一号线站名由邵秉仁、朱关田、李铎、言恭达等书法家题写」）交叉印证；
 *     主线沿线未设题写者说明，故该段题写者属落款考证结论，详见各分组注释；
 *   - 1 号线东延线：题写者姓名与身份取自沈阳地铁微信公众号自动回复中的官方信息；
 *   - 3 号线：题字于该线 2026 年全线开通后安装，题写者取自落款辨认 +
 *     公开资料，多为辽宁省 / 沈阳市书协书法家。
 * 一律不臆测题写渊源、不自行增补；无法确认的题写者宁可不收录。
 */
const CALLIGRAPHY_DATA = {
    // -------------------------------------------------------------------------
    // 1号线主线（2010 年开通）：站名由中国书法家协会副主席一级的书法家题写
    // （沈阳地铁官网《文化地铁五年行》2015 年口径：「一号线站名由邵秉仁、朱关田、
    //   李铎、言恭达等书法家题写」）。本组题写者均取自站内题字墙落款辨认 +
    // 公开资料（中国书协职务等）整理。
    // 落款说明：开发大道站落款第二字在「若 / 善」之间，「吴若璋」查无此人，
    // 故按吴善璋（中国书协第五、六届副主席）收录；怀远门站落款为「东民 己丑夏」，
    // 吴东民素以「东民」署名（钤「吴东民印」），且系连续三届中国书协副主席；
    // 张士站落款为「长青」（不署姓），据同一署名规律判定为赵长青，仅记录题写事实。
    // 待核实项：云峰北街（潘云鹤）、太原街（沈鹏）两站官方未公布题写者名录，
    // 系落款字形辨认并经公开作品落款交叉印证后收录；其中潘云鹤并非中国书协会员，
    // 与「邀请书协副主席以上」的通行说法不符。日后如有官方资料，以其为准。
    // -------------------------------------------------------------------------
    "0102": {
        // 落款为「林岫题」，第二字上「山」下「由」，草书易误读作「曲」
        calligrapher: { name: "林岫", intro: "林岫，女，1945年生，浙江绍兴人，诗人、学者，中国书法家协会第四、五届副主席，北京市书法家协会主席" }
    },
    "0103": {
        image: "./city/shenyang/assets/calligraphy/qihaojie.png",
        ratio: 2.5,
        alt: "七号街站",
        calligrapher: { name: "刘艺", intro: "刘艺，中国书法家协会顾问、原副主席，第四届中国书法兰亭奖终身成就奖获得者" }
    },
    "0104": {
        image: "./city/shenyang/assets/calligraphy/sihaojie.png",
        ratio: 2.322,
        alt: "四号街站",
        calligrapher: { name: "邵秉仁", intro: "邵秉仁，中国书法家协会顾问、第五届中国书法家协会副主席" }
    },
    "0105": {
        // 落款「长青」（不署姓，第二字上部「十」形、下部圆转带横，为行草「青」），
        // 与赵长青公开作品款识「辛卯夏月，长青」「长青题」（钤「长青印信」）一致；
        // 其为辽宁义县人，2005—2014 年主持中国书协日常工作，与主线题写者级别相合。
        // 按方案 B 收录：只记录题写事实与籍贯，不展示职务简介。
        calligrapher: { name: "赵长青", intro: "赵长青，辽宁义县人" }
    },
    "0106": {
        // 落款横排「吴善璋题」，第二字在「若 / 善」之间，按「善」收录（见上方落款说明）
        calligrapher: { name: "吴善璋", intro: "吴善璋，1948年生，江苏苏州人，中国书法家协会第五、六届副主席、行书委员会主任，宁夏书法家协会名誉主席" }
    },
    "0107": {
        calligrapher: { name: "陈永正", intro: "陈永正，1941年生，广东高州人，中山大学中文系教授，中国书法家协会第四、五届副主席，广东省书法家协会原主席" }
    },
    "0108": {
        // 与四号街站同由邵秉仁题写
        calligrapher: { name: "邵秉仁", intro: "邵秉仁，中国书法家协会顾问、第五届中国书法家协会副主席" }
    },
    "0113": {
        // 落款为「潘雲鹤」（第三字为左「隺」右「鸟」的行草「鹤」），与其公开作品
        // 落款（兰亭书法社《咏湘江》署「和山堂 雲鶴」）字形结构一致；身份待核实
        image: "./city/shenyang/assets/calligraphy/yunfengbeijie.png",
        ratio: 2.5,
        alt: "云峰北街站",
        calligrapher: { name: "潘云鹤", intro: "潘云鹤，中国工程院院士、原浙江大学校长，学者书法家" }
    },
    "0114": {
        image: "./city/shenyang/assets/calligraphy/shenyangzhan.png",
        ratio: 2.287,
        alt: "沈阳站站",
        calligrapher: { name: "言恭达", intro: "言恭达，中国书法家协会顾问、原副主席，国家一级美术师" }
    },
    "0115": {
        // 落款为竖排「沈鹏」两字、下钤朱文「沈鹏」印，与沈鹏公开作品落款（款识
        // 「沈鹏」、钤印「沈鹏 介居」）逐字比对一致；身份待核实
        image: "./city/shenyang/assets/calligraphy/taiyuanjie.png",
        ratio: 2.572,
        alt: "太原街站",
        calligrapher: { name: "沈鹏", intro: "沈鹏，中国书法家协会第四届主席、中国文联第六届副主席" }
    },
    "0117": {
        // 有辽沈晚报 2010-09-17 报道直接佐证：「书法家李铎题写的『青年大街站』」
        calligrapher: { name: "李铎", intro: "李铎，1930年生，湖南醴陵人，中国书法家协会第三届副主席、第四至六届顾问，中国人民革命军事博物馆研究馆员" }
    },
    "0118": {
        // 落款「东民 己丑夏」（己丑即 2009 年），吴东民落款素以「东民」署名、钤「吴东民印」
        calligrapher: { name: "吴东民", intro: "吴东民，1956年生，海南万宁人，中国书法家协会第五、六、七届副主席，海南省书法家协会主席" }
    },
    "0119": {
        calligrapher: { name: "朱关田", intro: "朱关田，1944年生，浙江绍兴人，中国书法家协会第四、五届副主席、顾问，西泠印社副社长" }
    },
    "0120": {
        calligrapher: { name: "旭宇", intro: "旭宇，本名许玉堂，河北玉田人，中国书法家协会第四、五届副主席，河北省书法家协会名誉主席" }
    },

    // 1 号线东延线（2025 年开通）：站名由辽宁 / 沈阳书法界名家题写，
    // 题写者姓名与身份取自沈阳地铁微信公众号自动回复提供的官方信息
    // （沈阳日报 2025 年报道亦载「胡崇炜、董文、李仲元等 10 位」，与之相符）。
    "0123": {
        image: "./city/shenyang/assets/calligraphy/xinhuijie.png",
        ratio: 2.287,
        alt: "新惠街站",
        calligrapher: {
            name: "王贺良",
            intro: "王贺良，辽宁省书协顾问，辽宁书法“九畹”之一"
        }
    },
    "0124": {
        image: "./city/shenyang/assets/calligraphy/xinningjie.png",
        ratio: 2.145,
        alt: "新宁街站",
        calligrapher: {
            name: "宋慧莹",
            intro: "宋慧莹，辽宁省书协顾问"
        }
    },
    "0125": {
        image: "./city/shenyang/assets/calligraphy/dongdayingjie.png",
        ratio: 3.357,
        alt: "东大营街站",
        calligrapher: {
            name: "宋鍦",
            intro: "宋鍦，辽宁省职工书协主席、沈阳市职工书协主席"
        }
    },
    "0126": {
        image: "./city/shenyang/assets/calligraphy/nongyedaxue.png",
        ratio: 3,
        alt: "农业大学站",
        calligrapher: {
            name: "卢林",
            intro: "卢林，沈阳市书协主席"
        }
    },
    "0127": {
        image: "./city/shenyang/assets/calligraphy/qianling.png",
        ratio: 1.572,
        alt: "前陵站",
        calligrapher: {
            name: "张殿忠",
            intro: "张殿忠，沈阳市书协副主席"
        }
    },
    "0128": {
        image: "./city/shenyang/assets/calligraphy/donglinggongyuan.png",
        ratio: 2.645,
        alt: "东陵公园站",
        calligrapher: {
            name: "李仲元",
            intro: "李仲元，沈阳市书协名誉主席，辽宁书法“九畹”之一"
        }
    },
    "0129": {
        image: "./city/shenyang/assets/calligraphy/shuiquan.png",
        ratio: 1.607,
        alt: "水泉站",
        calligrapher: {
            name: "胡崇炜",
            intro: "胡崇炜，辽宁省书协主席"
        }
    },
    "0130": {
        image: "./city/shenyang/assets/calligraphy/boguanbeidajie.png",
        ratio: 3.68,
        alt: "伯官北大街站",
        calligrapher: {
            name: "朱成国",
            intro: "朱成国，沈阳市书协顾问"
        }
    },
    "0131": {
        image: "./city/shenyang/assets/calligraphy/zhiwuyuan.png",
        ratio: 2.072,
        alt: "植物园站",
        calligrapher: {
            name: "董文",
            intro: "董文，沈阳市书协名誉主席，辽宁书法“九畹”之一"
        }
    },
    "0132": {
        image: "./city/shenyang/assets/calligraphy/shuangma.png",
        ratio: 1.357,
        alt: "双马站",
        calligrapher: {
            name: "陈洪普",
            intro: "陈洪普，沈阳市书协副主席兼秘书长"
        }
    },

    // -------------------------------------------------------------------------
    // 1 号线题字实物确证、题写者待考的站点（占位条目）
    // 1 号线全线站内题字实物俱在（主线 2010 年开通、东延线 2025 年开通），
    // 但以下站点的题写者尚未考证出来、暂无可靠依据，故仅登记「本站有题字」
    // 这一事实，不臆测题写渊源。日后如有确证，以 image / calligrapher
    // 替换 pendingCalligrapher 即可。
    // -------------------------------------------------------------------------
    "0101": { pendingCalligrapher: true },  // 十三号街
    "0109": { pendingCalligrapher: true },  // 重工街
    "0110": { pendingCalligrapher: true },  // 启工街
    "0111": { pendingCalligrapher: true },  // 保工街
    "0112": { pendingCalligrapher: true },  // 铁西广场
    "0116": { pendingCalligrapher: true },  // 南市场
    "0121": { pendingCalligrapher: true },  // 滂江街
    "0122": { pendingCalligrapher: true },  // 黎明广场

    // -------------------------------------------------------------------------
    // 3号线（2024—2025 年分段开通）：题字于2026年更新，题写者多为辽宁省 /
    // 沈阳市书协书法家（省书协主席胡崇炜、驻会副主席兼秘书长李琳、秘书长李京臣、
    // 副主席施恩波等）。本组题写者同样取自落款辨认 + 公开资料整理。
    // 注：0911 大通湖街为 3 号线站序中的换乘站（沿用 9 号线侧站 ID）。
    // 落款说明：千岛湖街落款作「李晖」（日字旁），其个人艺历页亦作「李晖」
    // （字厢齐，1963 年生于沈阳，师从郭子绪），沈阳日报名家名录排版作「李辉」，
    // 系同一人；南八马路落款「海民题」（第二字为行草「民」），署名省略姓氏，
    // 即沈阳市书协副主席甘海民；南塔落款第三字为行草「臣」，即辽宁省书协秘书长李京臣。
    // -------------------------------------------------------------------------
    "0307": {
        calligrapher: { name: "施恩波", intro: "施恩波，字雨谷，中国书法家协会理事，辽宁省书法家协会副主席" }
    },
    "0309": {
        calligrapher: { name: "李琳", intro: "李琳，中国书法家协会理事、女书法家委员会秘书长，辽宁省书法家协会驻会副主席" }
    },
    "0311": {
        calligrapher: { name: "李晖", intro: "李晖，字厢齐，1963年生于沈阳，中国书法家协会会员，沈阳市书法家协会副主席、沈阳市硬笔书法家协会副主席" }
    },
    "0312": {
        calligrapher: { name: "欧阳明利", intro: "欧阳明利，1962年生，吉林桦甸人，北部战区陆军政治工作部文艺创作室专职创作员，国家一级美术师，中国书法家协会会员、辽宁省书法家协会理事" }
    },
    "0317": {
        // 落款「海民题」（第二字为行草「民」），署名省略姓氏，与其篆刻「海民」印一致
        calligrapher: { name: "甘海民", intro: "甘海民，字巨工，号吟庐，1962年生于沈阳，西泠印社社员，中国书法家协会篆刻委员会委员，辽宁省书法家协会副主席、沈阳市书法家协会副主席" }
    },
    "0320": {
        // 与水泉站（0129）同由胡崇炜题写
        calligrapher: { name: "胡崇炜", intro: "胡崇炜，1963年生于吉林大安，中国书法家协会理事、行书委员会副主任，辽宁省文联副主席、辽宁省书法家协会主席" }
    },
    "0323": {
        calligrapher: { name: "李京臣", intro: "李京臣，1971年生，中国书法家协会理事，辽宁省书法家协会秘书长" }
    },
    "0327": {
        calligrapher: { name: "高凤江", intro: "高凤江，字竹泉，1963年生，中国书法家协会会员，辽宁省书法家协会理事，沈阳市书法家协会副主席" }
    },
    "0911": {
        calligrapher: { name: "冷旭", intro: "冷旭，满族，1960年生，辽宁辽阳人，西泠印社社员，中国书法家协会篆书专业委员会委员，曾任辽宁美术馆馆长、辽宁画院院长" }
    },

    // -------------------------------------------------------------------------
    // 3 号线题字实物确证、题写者待考的站点（占位条目）
    // 3 号线题字于 2026 年随全线开通安装，站内题字实物俱在，但以下站点的
    // 题写者尚未考证出来、暂无可靠依据，故仅登记「本站有题字」这一事实。
    // 注：工业展览馆站沿用 2 号线侧站 ID 0212，其题字由莫言题写，已在
    //     2 号线分组收录，此处不重复登记；砂阳（0414）、江东街（1017）
    //     为 3 号线沿线换乘站，其在 4 / 10 号线侧无题字记录，故按 3 号线
    //     题字计入本组。
    // -------------------------------------------------------------------------
    "0301": { pendingCalligrapher: true },  // 李达
    "0302": { pendingCalligrapher: true },  // 铁西汽车工厂
    "0303": { pendingCalligrapher: true },  // 马贝
    "0304": { pendingCalligrapher: true },  // 中德大街
    "0305": { pendingCalligrapher: true },  // 细河悠谷
    "0306": { pendingCalligrapher: true },  // 翟家
    "0308": { pendingCalligrapher: true },  // 宁官
    "0310": { pendingCalligrapher: true },  // 甘官
    "0314": { pendingCalligrapher: true },  // 南李官
    "0315": { pendingCalligrapher: true },  // 凌空
    "0414": { pendingCalligrapher: true },  // 砂阳
    "0318": { pendingCalligrapher: true },  // 嘉兴街
    "0319": { pendingCalligrapher: true },  // 方型广场
    "0322": { pendingCalligrapher: true },  // 中科院金属所
    "0324": { pendingCalligrapher: true },  // 文富路
    "0325": { pendingCalligrapher: true },  // 富民街
    "1017": { pendingCalligrapher: true },  // 江东街

    // -------------------------------------------------------------------------
    // 2号线：站名由国内知名作家、诗人题写（延续 1 号线「一站一书家」的传统）
    // 站序按 2 号线一期由南向北排列；图集中的「市府广场」站即今人民广场站（0209）。
    // 简介文案取自沈阳地铁官网 images/to_2/jpg/ 下的官方简介页原文。
    // 题字横图需逐站实拍采集：已采到横图的站填写 image / ratio / alt（标题栏显示题字），
    // 尚未采到的站只保留 calligrapher（标题栏保持普通文字站名，仅在信息页显示简介）。
    // -------------------------------------------------------------------------
    "0219": {
        image: "./city/shenyang/assets/calligraphy/quanyunlu.png",
        ratio: 2.322,
        alt: "全运路站",
        calligrapher: { name: "苏叔阳", intro: "苏叔阳，男，生于1938年，河北保定人，代表作有《中国读本》《丹心谱》等" }
    },
    "0218": {
        calligrapher: { name: "吉狄马加", intro: "吉狄马加，男，生于1961年，四川凉山人，代表作有《“睡”的和弦》《天涯海角》等" }
    },
    "0217": {
        image: "./city/shenyang/assets/calligraphy/shijidasha.png",
        ratio: 3,
        alt: "世纪大厦站",
        calligrapher: { name: "余华", intro: "余华，男，生于1960年，浙江嘉兴人，代表作有《活着》《兄弟》等" }
    },
    "0216": {
        calligrapher: { name: "熊召政", intro: "熊召政，男，生于1953年，湖北英山人，代表作有《酒色财气》《在深山》等" }
    },
    "0215": {
        image: "./city/shenyang/assets/calligraphy/aotizhongxin.png",
        ratio: 2.287,
        alt: "奥体中心站",
        calligrapher: { name: "蒋子龙", intro: "蒋子龙，男，生于1941年，河北沧县人，代表作有《乔厂长上任记》《一个工厂秘书的日记》等" }
    },
    "0214": {
        image: "./city/shenyang/assets/calligraphy/wulihe.png",
        ratio: 2.715,
        alt: "五里河站",
        calligrapher: { name: "张贤亮", intro: "张贤亮，男，生于1936年，江苏南京人，代表作有《灵与肉》《肖尔布拉克》等" }
    },
    "0213": {
        image: "./city/shenyang/assets/calligraphy/shitushuguan.png",
        ratio: 2.572,
        alt: "市图书馆站",
        calligrapher: { name: "舒婷", intro: "舒婷，女，生于1952年，福建龙海人，代表作有《双桅船》《会唱歌的鸢尾花》等" }
    },
    "0212": {
        image: "./city/shenyang/assets/calligraphy/gongyezhanlanguan.png",
        ratio: 3.68,
        alt: "工业展览馆站",
        calligrapher: { name: "莫言", intro: "莫言，男，生于1955年，山东高密人，代表作有《红高粱家族》《丰乳肥臀》等" }
    },
    "0211": {
        image: "./city/shenyang/assets/calligraphy/qingniangongyuan.png",
        ratio: 2.395,
        alt: "青年公园站",
        calligrapher: { name: "贾平凹", intro: "贾平凹，男，生于1952年，陕西商洛人，代表作有《废都》《浮躁》等" }
    },
    "0209": {
        // 该站由「市府广场」更名为「人民广场」，题字图保留旧名书法并补印刷体注明
        image: "./city/shenyang/assets/calligraphy/renminguangchang.png",
        ratio: 5.037,
        alt: "人民广场站",
        inscribedOldName: "市府广场站",
        calligrapher: { name: "王充闾", intro: "王充闾，男，生于1935年，辽宁盘锦人，代表作有《柳荫絮语》《人才诗话》等" }
    },
    "0208": {
        image: "./city/shenyang/assets/calligraphy/jinrongzhongxin.png",
        ratio: 2.93,
        alt: "金融中心站",
        calligrapher: { name: "二月河", intro: "二月河，男，生于1945年，山西昔阳人，代表作有《康熙大帝》《雍正皇帝》等" }
    },
    "0207": {
        image: "./city/shenyang/assets/calligraphy/shenyangbeizhan.png",
        ratio: 3.68,
        alt: "沈阳北站站",
        calligrapher: { name: "梁晓声", intro: "梁晓声，男，生于1949年，黑龙江哈尔滨人，代表作有《这是一片神奇的土地》《今夜有暴风雪》等" }
    },
    "0206": {
        calligrapher: { name: "王蒙", intro: "王蒙，男，生于1934年，河北南皮人，代表作有《青春万岁》《活动变人形》等" }
    },
    "0205": {
        image: "./city/shenyang/assets/calligraphy/zhongyiyaodaxue.png",
        ratio: 3.5,
        alt: "中医药大学站",
        calligrapher: { name: "李瑛", intro: "李瑛，男，生于1926年，河北丰润人，代表作有《石城底青苗》《我骄傲，我是一棵树》等" }
    },
    "0204": {
        calligrapher: { name: "贺敬之", intro: "贺敬之，男，生于1924年，山东峄县人，代表作有《白毛女》《回延安》等" }
    },
    "0203": {
        calligrapher: { name: "霍达", intro: "霍达，女，生于1945年，北京人，代表作有《穆斯林的葬礼》《公子扶苏》等" }
    },
    "0202": {
        calligrapher: { name: "陈忠实", intro: "陈忠实，男，生于1942年，陕西西安人，代表作有《白鹿原》《乡村》等" }
    },
    "0201": {
        calligrapher: { name: "杨大群", intro: "杨大群，男，生于1927年，辽宁新民人，代表作有《毛岸英》《关东江河》等" }
    },
    "0251": {
        calligrapher: { name: "周明", intro: "周明，男，生于1934年，陕西周至人，代表作有《榜样》《在莽莽的绿色世界》等" }
    },
    "0252": {
        calligrapher: { name: "高洪波", intro: "高洪波，男，生于1951年，内蒙古人，代表作有《大象法官》《波斯猫》等" }
    },
    "0253": {
        image: "./city/shenyang/assets/calligraphy/hangkonghangtiandaxue.png",
        ratio: 4.037,
        alt: "航空航天大学站",
        calligrapher: { name: "阎肃", intro: "阎肃，男，生于1930年，河北保定人，代表作有《江姐》《说唱脸谱》等" }
    },
    "0254": {
        calligrapher: { name: "邵燕祥", intro: "邵燕祥，男，生于1933年，北京人，代表作有《到远方去》《在远方》等" }
    }
};

window.CALLIGRAPHY_DATA = CALLIGRAPHY_DATA;
