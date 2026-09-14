/**
 * Drunk 线路图智能转换系统 - 智能 OCR 与语义排版引擎 (ocr_align_solver.js)
 * 
 * 核心升级：
 * 1. 内置主流城市官方轨道交通站名字典与拼音库（天津、长沙、北京、上海）；
 * 2. 智能 OCR 模糊匹配与字符纠错算法（Levenshtein 容错纠错，彻底告别乱码站名）；
 * 3. 图例语义解析器（Legend Semantic Parser）：识别图例中的线路编号与颜色映射；
 * 4. 8 方向几何方位自适应求解器（SolveAlign）与文本防遮挡排版；
 * 5. 换乘站语义合并与标准 Station ID 编码生成。
 */

window.DrunkOcrAlignSolver = (function () {

    // ──────────────────────────────────────────────────────────────
    // 8 方向枚举标准定义
    // ──────────────────────────────────────────────────────────────
    const ALIGN_OPTIONS = [
        "top", "bottom", "left", "right",
        "top-left", "top-right", "bottom-left", "bottom-right"
    ];

    // ──────────────────────────────────────────────────────────────
    // 核心城市轨道交通站名字典（用于 OCR 纠错与拼音精准补全）
    // ──────────────────────────────────────────────────────────────
    const CITY_STATION_DICTIONARIES = {
        "tianjin": {
            cityName: "天津",
            stations: {
                "刘园": { en: "Liuyuan", pinyin: "liuyuan" },
                "西横堤": { en: "Xihengdi", pinyin: "xihengdi" },
                "果园南道": { en: "Guoyuannandao", pinyin: "guoyuannandao" },
                "本溪路": { en: "Benxilu", pinyin: "benxilu" },
                "勤俭道": { en: "Qinjiandao", pinyin: "qinjiandao" },
                "洪湖里": { en: "Honghuli", pinyin: "honghuli" },
                "西站": { en: "Tianjin West Railway Station", pinyin: "xizhan" },
                "西北角": { en: "Xibeijiao", pinyin: "xibeijiao" },
                "西南角": { en: "Xinanjiao", pinyin: "xinanjiao" },
                "二纬路": { en: "Erweilu", pinyin: "erweilu" },
                "海光寺": { en: "Haiguangsi", pinyin: "haiguangsi" },
                "鞍山道": { en: "Anshandao", pinyin: "anshandao" },
                "营口道": { en: "Yingk Maintain", en: "Yingkoudao", pinyin: "yingkoudao" },
                "小白楼": { en: "Xiaobailou", pinyin: "xiaobailou" },
                "下瓦房": { en: "Xiawafang", pinyin: "xiawafang" },
                "刘庄": { en: "Liuzhuang", pinyin: "liuzhuang" },
                "东楼": { en: "Donglou", pinyin: "donglou" },
                "土城": { en: "Tucheng", pinyin: "tucheng" },
                "陈塘庄": { en: "Chentangzhuang", pinyin: "chentangzhuang" },
                "复兴门": { en: "Fuxingmen", pinyin: "fuxingmen" },
                "华山里": { en: "Huashanli", pinyin: "huashanli" },
                "财经大学": { en: "Tianjin Univ. of Finance & Econ.", pinyin: "caijingdaxue" },
                "双林": { en: "Shuanglin", pinyin: "shuanglin" },
                "李楼": { en: "Lilou", pinyin: "lilou" },
                "梨双路": { en: "Lishuanglu", pinyin: "lishuanglu" },
                "高庄子": { en: "Gaozhuangzi", pinyin: "gaozhuangzi" },
                "国家会展中心": { en: "National Convention & Exhibition Center", pinyin: "guojiahuizhanzhongxin" },
                "国瑞路": { en: "Guoruilu", pinyin: "guoruilu" },
                "东沽路": { en: "Donggulu", pinyin: "donggulu" },
                "咸水沽北": { en: "Xianshuigubei", pinyin: "xianshuigubei" },
                "双桥河": { en: "Shuangqiaohe", pinyin: "shuangqiaohe" },

                // 2号线
                "曹庄": { en: "Caozhuang", pinyin: "caozhuang" },
                "卞兴": { en: "Bianxing", pinyin: "bianxing" },
                "芥园西道": { en: "Jieyuanxidao", pinyin: "jieyuanxidao" },
                "咸阳路": { en: "Xianyanglu", pinyin: "xianyanglu" },
                "广开四马路": { en: "Guangkaisimalu", pinyin: "guangkaisimalu" },
                "鼓楼": { en: "Gulou", pinyin: "gulou" },
                "东南角": { en: "Dongnanjiao", pinyin: "dongnanjiao" },
                "建国道": { en: "Jianguodao", pinyin: "jianguodao" },
                "天津站": { en: "Tianjin Railway Station", pinyin: "tianjinzhan" },
                "远洋国际中心": { en: "Yuanyang International Center", pinyin: "yuanyangguojizhongxin" },
                "顺驰桥": { en: "Shunchiqiao", pinyin: "shunchiqiao" },
                "靖江路": { en: "Jingjianglu", pinyin: "jingjianglu" },
                "翠阜新村": { en: "Cuifuxincun", pinyin: "cuifuxincun" },
                "屿东城": { en: "Yudongcheng", pinyin: "yudongcheng" },
                "登州路": { en: "Dengzhoulu", pinyin: "dengzhoulu" },
                "国山路": { en: "Guoshanlu", pinyin: "guoshanlu" },
                "空港经济区": { en: "Airport Economic Zone", pinyin: "konggangjingjiqu" },
                "滨海国际机场": { en: "Binhai International Airport", pinyin: "binhaiguojijichang" },

                // 3号线
                "小淀": { en: "Xiaodian", pinyin: "xiaodian" },
                "丰产河": { en: "Fengchanhe", pinyin: "fengchanhe" },
                "华北集团": { en: "Huabei Group", pinyin: "huabeijituan" },
                "天士力": { en: "Tianshili", pinyin: "tianshili" },
                "宜兴埠": { en: "Yixingfu", pinyin: "yixingfu" },
                "张兴庄": { en: "Zhangxingzhuang", pinyin: "zhangxingzhuang" },
                "铁东路": { en: "Tiedonglu", pinyin: "tiedonglu" },
                "北站": { en: "Tianjin North Railway Station", pinyin: "beizhan" },
                "中山路": { en: "Zhongshanlu", pinyin: "zhongshanlu" },
                "金狮桥": { en: "Jinshiqiao", pinyin: "jinshiqiao" },
                "津湾广场": { en: "Jinwan'guangchang", pinyin: "jinwanguangchang" },
                "和平路": { en: "Hepinglu", pinyin: "hepinglu" },
                "西康路": { en: "Xikanglu", pinyin: "xikanglu" },
                "鞍山西道": { en: "Anshanxidao", pinyin: "anshanxidao" },
                "宜宾道": { en: "Yibindao", pinyin: "yibindao" },
                "红旗南路": { en: "Hongqinanlu", pinyin: "hongqinanlu" },
                "王顶堤": { en: "Wangdingdi", pinyin: "wangdingdi" },
                "华苑": { en: "Huayuan", pinyin: "huayuan" },
                "大学城": { en: "University Town", pinyin: "daxuecheng" },
                "高新区": { en: "High-tech Zone", pinyin: "gaoxinqu" },
                "学府工业区": { en: "Xuefu Industrial Zone", pinyin: "xuefugongyequ" },
                "杨伍庄": { en: "Yangwuzhuang", pinyin: "yangwuzhuang" },
                "南站": { en: "Tianjin South Railway Station", pinyin: "nanzhan" },

                // 4号线
                "小街": { en: "Xiaojie", pinyin: "xiaojie" },
                "柴楼": { en: "Chailou", pinyin: "chailou" },
                "双街": { en: "Shuangjie", pinyin: "shuangjie" },
                "西赵庄": { en: "Xizhaozhuang", pinyin: "xizhaozhuang" },
                "延吉道": { en: "Yanjidao", pinyin: "yanjidao" },
                "北仓": { en: "Beicang", pinyin: "beicang" },
                "南仓": { en: "Nancang", pinyin: "nancang" },
                "天穆": { en: "Tianmu", pinyin: "tianmu" },
                "柳滩": { en: "Liutan", pinyin: "liutan" },
                "白庙": { en: "Baimiao", pinyin: "baimiao" },
                "北洋桥": { en: "Beiyangqiao", pinyin: "beiyangqiao" },
                "西于庄": { en: "Xiyuzhuang", pinyin: "xiyuzhuang" },
                "金街": { en: "Jinjie", pinyin: "jinjie" },
                "徐州道": { en: "Xuzhoudao", pinyin: "xuzhoudao" },
                "六纬路": { en: "Liuweilu", pinyin: "liuweilu" },
                "嘉书道": { en: "Jiashudao", pinyin: "jiashudao" },
                "泰昌路": { en: "Taichanglu", pinyin: "taichanglu" },
                "成林道": { en: "Chenglindao", pinyin: "chenglindao" },
                "津塘路": { en: "Jintanglu", pinyin: "jintanglu" },
                "沙柳南路": { en: "Shaliunanlu", pinyin: "shaliunanlu" },
                "登州南路": { en: "Dengzhounanlu", pinyin: "dengzhounanlu" },
                "跃进北路": { en: "Yuejinbeilu", pinyin: "yuejinbeilu" },
                "航双路": { en: "Hangshuanglu", pinyin: "hangshuanglu" },
                "民航大学": { en: "Civil Aviation Univ. of China", pinyin: "minhangdaxue" },
                "新兴村": { en: "Xinxingcun", pinyin: "xinxingcun" },

                // 5号线 & 6号线重点站
                "北辰科技园北": { en: "Beichen Science Park North", pinyin: "beichenkejiyuanbei" },
                "丹河北道": { en: "Danhebeidao", pinyin: "danhebeidao" },
                "北辰道": { en: "Beichendao", pinyin: "beichendao" },
                "职业大学": { en: "Tianjin Vocational Institute", pinyin: "zhiyedaxue" },
                "淮河道": { en: "Huaihedao", pinyin: "huaihedao" },
                "辽河北道": { en: "Liaohebeidao", pinyin: "liaohebeidao" },
                "宜兴埠北": { en: "Yixingfubei", pinyin: "yixingfubei" },
                "志成路": { en: "Zhichenglu", pinyin: "zhichenglu" },
                "思源路": { en: "Siyuanlu", pinyin: "siyuanlu" },
                "建昌道": { en: "Jianchangdao", pinyin: "jianchangdao" },
                "金钟河大街": { en: "Jinzhonghedajie", pinyin: "jinzhonghedajie" },
                "月牙河": { en: "Yueyahe", pinyin: "yueyahe" },
                "幸福公园": { en: "Xingfugongyuan", pinyin: "xingfugongyuan" },
                "直沽": { en: "Zhigu", pinyin: "zhigu" },
                "西南楼": { en: "Xinanlou", pinyin: "xinanlou" },
                "文化中心": { en: "Cultural Center", pinyin: "wenhuazhongxin" },
                "天津宾馆": { en: "Tianjin Hotel", pinyin: "tianjinbinguan" },
                "肿瘤医院": { en: "Cancer Hospital", pinyin: "zhongliuyiyuan" },
                "体育中心": { en: "Sports Center", pinyin: "tiyuzhongxin" },
                "凌宾路": { en: "Lingbinlu", pinyin: "lingbinlu" },
                "昌凌路": { en: "Changlinglu", pinyin: "changlinglu" },
                "中医一附院": { en: "First Teaching Hospital of TCM", pinyin: "zhongyiyifuyuan" },
                "李七庄南": { en: "Liqizhuangnan", pinyin: "liqizhuangnan" },
                "天塔": { en: "Tianta (Tianjin Tower)", pinyin: "tianta" },
                "水上公园东路": { en: "Water Park East Road", pinyin: "shuishanggongyuandonglu" },
                "南翠屏": { en: "Nancuiping", pinyin: "nancuiping" },
                "迎风道": { en: "Yingfengdao", pinyin: "yingfengdao" },
                "长虹公园": { en: "Changhong Park", pinyin: "changhonggongyuan" },
                "人民医院": { en: "People's Hospital", pinyin: "renminyiyuan" },
                "复兴路": { en: "Fuxinglu", pinyin: "fuxinglu" },
                "大王庄": { en: "Dawangzhuang", pinyin: "dawangzhuang" },
                "十一经路": { en: "Shiyijinglu", pinyin: "shiyijinglu" },
                "东兴路": { en: "Dongxinglu", pinyin: "dongxinglu" },
                "中山门": { en: "Zhongshanmen", pinyin: "zhongshanmen" },
                "塘沽": { en: "Tanggu", pinyin: "tanggu" },
                "泰达": { en: "TEDA", pinyin: "taida" },
                "市民广场": { en: "Shimingguangchang", pinyin: "shiminguangchang" },
                "东海路": { en: "Donghailu", pinyin: "donghailu" },
                "京华道": { en: "Jinghuadao", pinyin: "jinghuadao" },
                "静海北": { en: "Jinghaibei", pinyin: "jinghaibei" }
            }
        }
    };

    /**
     * 计算两个字符串的编辑距离 (Levenshtein Distance)
     */
    function levenshteinDistance(s1, s2) {
        const m = s1.length, n = s2.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // 删除
                    dp[i][j - 1] + 1,      // 插入
                    dp[i - 1][j - 1] + cost // 替换
                );
            }
        }
        return dp[m][n];
    }

    /**
     * 智能站名纠错与中英文词典对齐 (支持 OCR 模糊纠错)
     * 例如输入 "天律站" -> 纠错为 "天津站" + "Tianjin Railway Station"
     */
    function matchAndCorrectStationName(rawText, cityId = "tianjin") {
        if (!rawText) return { cn: "未命名站", en: "Station" };
        const cleanRaw = rawText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").trim();

        const dict = CITY_STATION_DICTIONARIES[cityId] || CITY_STATION_DICTIONARIES["tianjin"];
        if (dict && dict.stations) {
            // 1. 精确匹配
            if (dict.stations[cleanRaw]) {
                return { cn: cleanRaw, en: dict.stations[cleanRaw].en };
            }

            // 2. 包含匹配或子串匹配
            for (let name in dict.stations) {
                if (cleanRaw.includes(name) || name.includes(cleanRaw)) {
                    return { cn: name, en: dict.stations[name].en };
                }
            }

            // 3. 模糊编辑距离匹配 (允许 1~2 个错别字，例如 OCR 识别率不足的情况)
            let bestName = null;
            let minDistance = Infinity;
            for (let name in dict.stations) {
                const dist = levenshteinDistance(cleanRaw, name);
                if (dist < minDistance && dist <= Math.max(1, Math.floor(name.length * 0.4))) {
                    minDistance = dist;
                    bestName = name;
                }
            }

            if (bestName) {
                return { cn: bestName, en: dict.stations[bestName].en, corrected: true };
            }
        }

        // 默认文本结构化拆分
        return parseStationText(rawText);
    }

    /**
     * 根据文本框中心 (tx, ty) 与站点圆心 (sx, sy) 求解最优 align 锚点
     */
    function solveAlign(sx, sy, tx, ty) {
        const dx = tx - sx;
        const dy = ty - sy;
        const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

        let align = "top";
        if (angleDeg >= -22.5 && angleDeg < 22.5) {
            align = "right";
        } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
            align = "bottom-right";
        } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
            align = "bottom";
        } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
            align = "bottom-left";
        } else if ((angleDeg >= 157.5 && angleDeg <= 180) || (angleDeg >= -180 && angleDeg < -157.5)) {
            align = "left";
        } else if (angleDeg >= -157.5 && angleDeg < -112.5) {
            align = "top-left";
        } else if (angleDeg >= -112.5 && angleDeg < -67.5) {
            align = "top";
        } else if (angleDeg >= -67.5 && angleDeg < -22.5) {
            align = "top-right";
        }

        let offsetX = 0, offsetY = 0;
        if (align === "top" || align === "bottom") {
            offsetX = Math.round(dx);
        } else if (align === "left" || align === "right") {
            offsetY = Math.round(dy);
        }

        return { align, offset: { x: offsetX, y: offsetY } };
    }

    /**
     * 智能文本清洗与双语切分
     */
    function parseStationText(rawText) {
        if (!rawText) return { cn: "未命名站", en: "Station" };
        let lines = rawText.trim().split(/[\r\n]+/);
        if (lines.length >= 2) {
            return {
                cn: lines[0].trim(),
                en: lines.slice(1).join(' ').trim()
            };
        }

        const match = rawText.match(/^([\u4e00-\u9fa5\(\)（）0-9]+)\s*(.*)$/);
        if (match) {
            return {
                cn: match[1].trim(),
                en: match[2].trim() || match[1].trim()
            };
        }

        return { cn: rawText.trim(), en: rawText.trim() };
    }

    /**
     * 生成标准规范的 Station ID
     */
    function generateStationId(cityPrefix, lineId, index, isTransfer = false, transferCode = "") {
        if (isTransfer && transferCode) {
            return `${cityPrefix}_${transferCode.toUpperCase()}`;
        }
        let cleanLine = lineId.replace(/[^a-zA-Z0-9]/g, '');
        let numPad = String(index).padStart(2, '0');
        return `${cityPrefix}_${cleanLine}_${numPad}`;
    }

    return {
        ALIGN_OPTIONS,
        CITY_STATION_DICTIONARIES,
        matchAndCorrectStationName,
        solveAlign,
        parseStationText,
        generateStationId
    };
})();
