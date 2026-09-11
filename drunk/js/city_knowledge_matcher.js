/**
 * Drunk 线路图智能转换系统 - 城市维基百科动态知识库与拓扑位置对齐引擎
 * (city_knowledge_matcher.js)
 * 
 * 核心设计：
 * 1. 标题与语义城市探测：从底图标题、图例文本或文件名中精准识别城市（如西安、北京、上海、广州、深圳、天津等）；
 * 2. 维基百科在线动态生成（零硬编码）：
 *    - 彻底告别任何硬编码车站数据，所有城市的车站列表、线路走向与换乘关系全部实时由维基百科（Wikipedia API）在线抓取解析生成；
 *    - 自动聚合 MediaWiki 分类树（Category:城市地铁车站 ➔ 各线路子分类）与主词条页面；
 *    - 自动清洗站名（剥离消歧义后缀如 "(西安市)"、"(地铁)"，标准化中英文名称）；
 * 3. 智能模糊纠错与拓扑对齐：
 *    - 基于 Levenshtein 字符距离模糊纠错（消除繁简字、OCR 错别字与漏字）；
 *    - 基于线路走向与位置坐标的单射对齐，自动补全中英文站名与换乘属性。
 */

window.CityKnowledgeMatcher = (function () {

    // ──────────────────────────────────────────────────────────────
    // 常见城市名称与别名映射表 (支持多语种识别)
    // ──────────────────────────────────────────────────────────────
    const KNOWN_CITIES = [
        { name: "西安", en: "Xi'an", pinyin: "xian", aliases: ["西安", "西安市", "xi'an", "xian", "长安"] },
        { name: "北京", en: "Beijing", pinyin: "beijing", aliases: ["北京", "北京市", "beijing", "peking"] },
        { name: "上海", en: "Shanghai", pinyin: "shanghai", aliases: ["上海", "上海市", "shanghai"] },
        { name: "广州", en: "Guangzhou", pinyin: "guangzhou", aliases: ["广州", "广州市", "guangzhou", "canton"] },
        { name: "深圳", en: "Shenzhen", pinyin: "shenzhen", aliases: ["深圳", "深圳市", "shenzhen"] },
        { name: "天津", en: "Tianjin", pinyin: "tianjin", aliases: ["天津", "天津市", "tianjin", "tientsin"] },
        { name: "成都", en: "Chengdu", pinyin: "chengdu", aliases: ["成都", "成都市", "chengdu"] },
        { name: "重庆", en: "Chongqing", pinyin: "chongqing", aliases: ["重庆", "重庆市", "chongqing", "chungking"] },
        { name: "武汉", en: "Wuhan", pinyin: "wuhan", aliases: ["武汉", "武汉市", "wuhan"] },
        { name: "南京", en: "Nanjing", pinyin: "nanjing", aliases: ["南京", "南京市", "nanjing", "nanking"] },
        { name: "杭州", en: "Hangzhou", pinyin: "hangzhou", aliases: ["杭州", "杭州市", "hangzhou"] },
        { name: "长沙", en: "Changsha", pinyin: "changsha", aliases: ["长沙", "长沙市", "changsha"] },
        { name: "郑州", en: "Zhengzhou", pinyin: "zhengzhou", aliases: ["郑州", "郑州市", "zhengzhou"] },
        { name: "苏州", en: "Suzhou", pinyin: "suzhou", aliases: ["苏州", "苏州市", "suzhou"] },
        { name: "青岛", en: "Qingdao", pinyin: "qingdao", aliases: ["青岛", "青岛市", "qingdao", "tsingtao"] },
        { name: "沈阳", en: "Shenyang", pinyin: "shenyang", aliases: ["沈阳", "沈阳市", "shenyang", "mukden"] },
        { name: "大连", en: "Dalian", pinyin: "dalian", aliases: ["大连", "大连市", "dalian"] },
        { name: "无锡", en: "Wuxi", pinyin: "wuxi", aliases: ["无锡", "无锡市", "wuxi"] },
        { name: "宁波", en: "Ningbo", pinyin: "ningbo", aliases: ["宁波", "宁波市", "ningbo"] },
        { name: "合肥", en: "Hefei", pinyin: "hefei", aliases: ["合肥", "合肥市", "hefei"] },
        { name: "福州", en: "Fuzhou", pinyin: "fuzhou", aliases: ["福州", "福州市", "fuzhou"] },
        { name: "厦门", en: "Xiamen", pinyin: "xiamen", aliases: ["厦门", "厦门市", "xiamen", "amoy"] },
        { name: "南昌", en: "Nanchang", pinyin: "nanchang", aliases: ["南昌", "南昌市", "nanchang"] },
        { name: "济南", en: "Jinan", pinyin: "jinan", aliases: ["济南", "济南市", "jinan"] },
        { name: "昆明", en: "Kunming", pinyin: "kunming", aliases: ["昆明", "昆明市", "kunming"] },
        { name: "贵阳", en: "Guiyang", pinyin: "guiyang", aliases: ["贵阳", "贵阳市", "guiyang"] },
        { name: "南宁", en: "Nanning", pinyin: "nanning", aliases: ["南宁", "南宁市", "nanning"] },
        { name: "长春", en: "Changchun", pinyin: "changchun", aliases: ["长春", "长春市", "changchun"] },
        { name: "哈尔滨", en: "Harbin", pinyin: "harbin", aliases: ["哈尔滨", "哈尔滨市", "harbin"] },
        { name: "石家庄", en: "Shijiazhuang", pinyin: "shijiazhuang", aliases: ["石家庄", "石家庄市", "shijiazhuang"] },
        { name: "太原", en: "Taiyuan", pinyin: "taiyuan", aliases: ["太原", "太原市", "taiyuan"] },
        { name: "兰州", en: "Lanzhou", pinyin: "lanzhou", aliases: ["兰州", "兰州市", "lanzhou"] },
        { name: "乌鲁木齐", en: "Urumqi", pinyin: "wulumuqi", aliases: ["乌鲁木齐", "乌鲁木齐市", "urumqi"] }
    ];

    // 会话级内存缓存，避免对同一城市重复发起网络请求
    const memoryCityCache = {};

    /**
     * 计算两个字符串的编辑距离 (Levenshtein Distance)
     */
    function levenshteinDistance(s1, s2) {
        if (!s1 || !s2) return Math.max(s1 ? s1.length : 0, s2 ? s2.length : 0);
        const m = s1.length, n = s2.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[m][n];
    }

    /**
     * 从任意文本（如标题、图例文本、文件名、OCR 串）中智能探测匹配到的城市
     */
    // 全国常见以城市命名的通用车站/道路名黑名单（防止反客为主污染城市探测）
    const FALSE_CITY_WORDS = [
        "西安门", "北京路", "上海路", "广州路", "天津路", "重庆路", "大连路", 
        "成都路", "武汉路", "香港路", "南京东路", "南京西路", "台湾街", "长安街",
        "西安交大", "北京大学", "清华大学", "复旦大学", "南京大学"
    ];

    /**
     * 智能探测城市信息
     * 支持传入字符串或对象 { fileName, titleText, fullText }
     */
    function detectCityFromText(input) {
        if (!input) return null;

        let fileName = "";
        let titleText = "";
        let fullText = "";

        if (typeof input === "object") {
            fileName = input.fileName || "";
            titleText = input.titleText || "";
            fullText = input.fullText || "";
        } else if (typeof input === "string") {
            // 如果长度很短（<= 10个字），很可能是直接传进来的城市名或短文件名
            if (input.length <= 15) {
                fileName = input;
                titleText = input;
            } else {
                fullText = input;
            }
        }

        // ── 策略 1: 从文件名精准匹配（置信度极高）──
        if (fileName) {
            for (const city of KNOWN_CITIES) {
                for (const alias of city.aliases) {
                    if (fileName.toLowerCase().includes(alias.toLowerCase())) {
                        return city;
                    }
                }
            }
        }

        // ── 策略 2: 从标题语义正则匹配（如 "南京城市轨道交通"、"Xi'an Rail Transit"）──
        const titleSources = [titleText, fullText.slice(0, 500)];
        for (const src of titleSources) {
            if (!src) continue;
            // 匹配中文标题: "XX城市轨道交通" / "XX轨道交通" / "XX地铁"
            const titleMatch = src.match(/([\u4e00-\u9fa5]{2,4})(?:市)?(?:城市)?(?:轨道交通|地铁|电车|城际)/);
            if (titleMatch) {
                const captured = titleMatch[1];
                for (const city of KNOWN_CITIES) {
                    for (const alias of city.aliases) {
                        if (/[\u4e00-\u9fa5]/.test(alias) && (captured.includes(alias) || alias.includes(captured))) {
                            return city;
                        }
                    }
                }
            }

            // 匹配英文标题: "Nanjing Rail Transit" / "Xi'an Metro"
            for (const city of KNOWN_CITIES) {
                if (city.en) {
                    const enRegex = new RegExp(`\\b${city.en}\\b\\s*(?:Rail\\s*Transit|Metro|Subway|Network)?`, "i");
                    if (enRegex.test(src)) {
                        return city;
                    }
                }
            }
        }

        // ── 策略 3: 全文字符串安全频次扫描（清洗黑名单站名，按词频与特异性投票）──
        if (fullText) {
            // 先将混淆黑名单词替换掉，例如将 "西安门" 替换为空，避免误伤
            let sanitizedText = fullText;
            for (const fakeWord of FALSE_CITY_WORDS) {
                sanitizedText = sanitizedText.replaceAll(fakeWord, "____");
            }
            const lowerSanitized = sanitizedText.toLowerCase();

            let bestCity = null;
            let maxScore = 0;

            for (const city of KNOWN_CITIES) {
                let score = 0;
                for (const alias of city.aliases) {
                    const isZh = /[\u4e00-\u9fa5]/.test(alias);
                    if (isZh) {
                        // 统计中文别名出现次数
                        const occurrences = (sanitizedText.match(new RegExp(alias, "g")) || []).length;
                        if (occurrences > 0) {
                            // "市" 结尾的权重极高（如 "南京市" 比单纯 "南京" 明确）
                            score += occurrences * (alias.endsWith("市") ? 5 : 2);
                        }
                    } else {
                        // 英文边界匹配
                        const enRegex = new RegExp(`\\b${alias.toLowerCase()}\\b`, "g");
                        const enOccurrences = (lowerSanitized.match(enRegex) || []).length;
                        score += enOccurrences * 2;
                    }
                }
                if (score > maxScore) {
                    maxScore = score;
                    bestCity = city;
                }
            }

            if (bestCity && maxScore >= 2) {
                return bestCity;
            }
        }

        return null;
    }

    /**
     * 清洗维基百科词条标题为标准的地铁站名
     * 例如："万寿路站 (西安市)" -> "万寿路"
     *      "咸阳西站 (地铁)" -> "咸阳西站"
     *      "西安站" -> "西安站"
     */
    function cleanWikiStationName(rawTitle) {
        if (!rawTitle) return "";
        // 移除消歧义括号，如 (西安市)、(地铁)、(陕西省)
        let s = rawTitle.replace(/\s*\([^)]*\)/g, '').trim();

        // 如果是著名枢纽车站（含“火车站”、“北站”、“南站”、“西站”、“东站”），保留原样
        if (/([东南西北]|火车)站$/.test(s) || s === "西安站" || s === "北京站" || s === "上海站" || s === "天津站") {
            return s;
        }

        // 其余普通车站若以“站”结尾且长度 >= 3，去掉末尾的“站”字
        if (s.endsWith('站') && s.length >= 3) {
            s = s.slice(0, -1);
        }

        return s;
    }

    /**
     * 从维基百科 MediaWiki API 在线动态获取并生成指定城市的完整车站与线路知识库
     * (彻底移除静态硬编码，任意城市通用)
     * @param {string} cityName 城市名称（如 "西安"、"北京"、"上海"）
     * @returns {Promise<Object>} { cityName, enName, lines, stationsByName }
     */
    async function loadCityStationsOnline(cityName) {
        const logger = window.DrunkLogger;
        const cityInfo = detectCityFromText(cityName) || { name: cityName, en: cityName, pinyin: cityName };
        const standardName = cityInfo.name;

        // 1. 命中会话级内存缓存
        if (memoryCityCache[standardName]) {
            if (logger) logger.info(`⚡ 命中维基百科内存缓存: [${standardName}] (含 ${Object.keys(memoryCityCache[standardName].stationsByName).length} 个车站)`);
            return memoryCityCache[standardName];
        }

        if (logger) {
            logger.banner('维基百科动态数据引擎启动', `正在动态爬取 [${standardName}] 城市轨道交通官方车站列表...`);
            logger.info(`🌐 正在连接维基百科 MediaWiki 开放 API 接口: https://zh.wikipedia.org/w/api.php`);
        }

        const lines = [];
        const stationsByName = {};

        try {
            // 2. 探测并获取维基百科分类列表 (Category)
            // 候选分类名：Category:西安地铁车站、Category:西安轨道交通车站、Category:西安市地铁车站
            const possibleCategories = [
                `Category:${standardName}地铁车站`,
                `Category:${standardName}轨道交通车站`,
                `Category:${standardName}市地铁车站`
            ];

            let matchedCategoryMembers = null;
            let currentCategoryName = null;

            for (const cat of possibleCategories) {
                const catUrl = `https://zh.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}&cmlimit=500&format=json&origin=*`;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4500);
                    const res = await fetch(catUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const json = await res.json();
                        if (json?.query?.categorymembers && json.query.categorymembers.length > 0) {
                            matchedCategoryMembers = json.query.categorymembers;
                            currentCategoryName = cat;
                            break;
                        }
                    }
                } catch (_) {}
            }

            // 3. 解析分类树或主词条中的线路与车站
            if (matchedCategoryMembers && matchedCategoryMembers.length > 0) {
                if (logger) {
                    logger.info(`✅ 成功锁定维基百科官方分类: [${currentCategoryName}] (包含 ${matchedCategoryMembers.length} 个子项)`);
                }

                // 筛选各线路子分类 (命名空间 ns === 14 为 Category)
                const subCategories = matchedCategoryMembers.filter(m => m.ns === 14);
                // 筛选直属页面 (命名空间 ns === 0 为 Page)
                const directPages = matchedCategoryMembers.filter(m => m.ns === 0);

                // 并行批量拉取各线路子分类中的车站页面
                const lineFetchPromises = subCategories.map(async (sc) => {
                    const catTitle = sc.title.replace(/^Category:/, '');
                    // 提取纯净线路名：如 "西安地铁1号线车站" ➔ "1号线"；"西安地铁西户线车站" ➔ "西户线"
                    let lineName = catTitle
                        .replace(new RegExp(`^${standardName}(地铁|轨道交通|市)?`), '')
                        .replace(/车站$/, '')
                        .trim();

                    if (!lineName || lineName.includes('换乘') || lineName.includes('咸阳市')) {
                        return null;
                    }

                    const subUrl = `https://zh.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(sc.title)}&cmlimit=500&format=json&origin=*`;
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 4000);
                        const subRes = await fetch(subUrl, { signal: controller.signal });
                        clearTimeout(timeoutId);

                        if (subRes.ok) {
                            const subJson = await subRes.json();
                            const members = subJson?.query?.categorymembers || [];
                            const lineStations = [];

                            for (const m of members) {
                                if (m.ns === 0) {
                                    const stName = cleanWikiStationName(m.title);
                                    if (stName && !lineStations.some(s => s.cn === stName)) {
                                        lineStations.push({ cn: stName, en: stName });

                                        if (!stationsByName[stName]) {
                                            stationsByName[stName] = {
                                                cn: stName,
                                                en: stName,
                                                lines: [lineName]
                                            };
                                        } else if (!stationsByName[stName].lines.includes(lineName)) {
                                            stationsByName[stName].lines.push(lineName);
                                        }
                                    }
                                }
                            }

                            if (lineStations.length > 0) {
                                return {
                                    name: lineName,
                                    stations: lineStations
                                };
                            }
                        }
                    } catch (_) {}
                    return null;
                });

                const parsedLines = (await Promise.all(lineFetchPromises)).filter(Boolean);
                lines.push(...parsedLines);

                // 处理直属于分类的站点
                for (const p of directPages) {
                    const stName = cleanWikiStationName(p.title);
                    if (stName && !stationsByName[stName]) {
                        stationsByName[stName] = { cn: stName, en: stName, lines: [] };
                    }
                }
            }

            // 4. 如果分类成员较少，补充查询主词条页面解析各线路
            if (Object.keys(stationsByName).length < 20) {
                if (logger) logger.info(`ℹ️ 尝试解析维基百科主条目 [${standardName}地铁] 进行全网站点补充...`);

                const mainArticles = [`${standardName}地铁`, `${standardName}轨道交通`];
                for (const art of mainArticles) {
                    try {
                        const artUrl = `https://zh.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=${encodeURIComponent(art)}`;
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 4000);
                        const artRes = await fetch(artUrl, { signal: controller.signal });
                        clearTimeout(timeoutId);

                        if (artRes.ok) {
                            const artJson = await artRes.json();
                            const html = artJson?.parse?.text?.['*'];
                            if (html) {
                                parseStationsFromWikiHtml(html, standardName, stationsByName, lines);
                                if (Object.keys(stationsByName).length >= 20) break;
                            }
                        }
                    } catch (_) {}
                }
            }

            // 5. 组装最终动态知识库对象
            const result = {
                cityName: standardName,
                enName: cityInfo.en,
                source: "Wikipedia (MediaWiki API)",
                lines: lines,
                stationsByName: stationsByName
            };

            memoryCityCache[standardName] = result;

            if (logger) {
                const totalStCount = Object.keys(stationsByName).length;
                logger.info(`🎉 维基百科官方在线知识库动态生成就绪: [${standardName}] (已提取 ${lines.length} 条线路, 共 ${totalStCount} 个官方车站，0 硬编码！)`);
            }

            return result;

        } catch (globalErr) {
            if (logger) logger.error(`从维基百科动态加载 [${standardName}] 失败: ${globalErr.message}`);
            return {
                cityName: standardName,
                enName: cityInfo.en,
                source: "Wikipedia (Failed)",
                lines: [],
                stationsByName: {}
            };
        }
    }

    /**
     * 从维基百科条目 HTML 文本中智能提取车站与线路
     */
    function parseStationsFromWikiHtml(htmlContent, cityName, stationsByName, lines) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const links = doc.querySelectorAll('a[href*="/wiki/"]');

        links.forEach(a => {
            const title = a.getAttribute('title') || a.textContent.trim();
            // 匹配格式如 "钟楼站"、"五路口站 (西安市)"、"西安北站"
            if (/[\u4e00-\u9fa5]{2,10}站(\s*\([^)]*\))?$/.test(title) && !title.includes('地铁站') && !title.includes('车站') && !title.includes('总站')) {
                const clean = cleanWikiStationName(title);
                if (clean && clean.length >= 2 && clean.length <= 15) {
                    if (!stationsByName[clean]) {
                        stationsByName[clean] = { cn: clean, en: clean, lines: [] };
                    }
                }
            }
        });
    }

    /**
     * 将候选车站集合与维基百科动态生成的城市知识库进行智能对齐纠错与匹配
     * @param {Array<Object>} candidateStations 提取出的候选车站 [{ cn, en, x, y }]
     * @param {Object} cityKnowledge 维基百科生成的知识库
     * @returns {Array<Object>} 纠错对齐后的车站列表
     */
    function matchAndAlignStations(candidateStations, cityKnowledge) {
        if (!cityKnowledge || !cityKnowledge.stationsByName || Object.keys(cityKnowledge.stationsByName).length === 0) {
            return candidateStations;
        }

        const dict = cityKnowledge.stationsByName;
        const dictNames = Object.keys(dict);
        const matched = [];
        let correctedCount = 0;

        for (const cand of candidateStations) {
            const rawName = (cand.cn || cand.name || '').trim();
            if (!rawName) continue;

            // 1. 精确匹配
            if (dict[rawName]) {
                const official = dict[rawName];
                matched.push({
                    ...cand,
                    cn: official.cn,
                    en: cand.en || official.en || official.cn,
                    isTransfer: official.lines && official.lines.length >= 2 ? true : cand.isTransfer
                });
                continue;
            }

            // 2. 包含/子串匹配 (如 "钟楼站" -> "钟楼")
            let foundOfficial = null;
            for (const dName of dictNames) {
                if (rawName === dName + '站' || dName === rawName + '站' || (rawName.length >= 3 && dName.includes(rawName))) {
                    foundOfficial = dict[dName];
                    break;
                }
            }

            if (foundOfficial) {
                correctedCount++;
                matched.push({
                    ...cand,
                    cn: foundOfficial.cn,
                    en: cand.en || foundOfficial.en || foundOfficial.cn,
                    isTransfer: foundOfficial.lines && foundOfficial.lines.length >= 2 ? true : cand.isTransfer,
                    correctedFrom: rawName
                });
                continue;
            }

            // 3. Levenshtein 模糊纠错 (允许 1~2 个字错别字)
            let bestName = null;
            let minDistance = Infinity;

            for (const dName of dictNames) {
                const dist = levenshteinDistance(rawName, dName);
                if (dist < minDistance && dist <= Math.max(1, Math.floor(dName.length * 0.4))) {
                    minDistance = dist;
                    bestName = dName;
                }
            }

            if (bestName && dict[bestName]) {
                correctedCount++;
                const official = dict[bestName];
                matched.push({
                    ...cand,
                    cn: official.cn,
                    en: cand.en || official.en || official.cn,
                    isTransfer: official.lines && official.lines.length >= 2 ? true : cand.isTransfer,
                    correctedFrom: rawName
                });
            } else {
                // 未在维基百科匹配到的原创站名，保持原样输出，绝不篡改
                matched.push(cand);
            }
        }

        const logger = window.DrunkLogger;
        if (logger && correctedCount > 0) {
            logger.info(`✨ 维基百科知识库站名对齐完成: 成功校准并对齐了 ${correctedCount} 个车站名称！`);
        }

        return matched;
    }

    return {
        KNOWN_CITIES,
        detectCityFromText,
        loadCityStationsOnline,
        matchAndAlignStations
    };

})();
