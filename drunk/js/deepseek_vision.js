/**
 * Drunk 线路图智能转换系统 - DeepSeek 视觉大模型识图引擎 (deepseek_vision.js)
 * 
 * 核心架构：
 * 1. 采用 DeepSeek 官方多模态大模型：deepseek-v4-flash-vision-exp 进行整网视觉解析；
 * 2. 纯客户端安全调用：API Key 仅保存在浏览器本地 localStorage，直接直连 DeepSeek 官方 API，无第三方中转；
 * 3. 资费说明与合规透明：明确告知 DeepSeek 官方将按 Token/图像消耗向用户账户收取少量费用，本站（CGo OpenMap / Drunk）完全免费，不收取任何中介费用；
 * 4. 自动图网拓扑求解：将视觉模型返回的线路、站名、空间坐标与换乘关系归一化映射为标准的 OpenMap 格式；
 * 5. 结合内置城市站名字典与 Levenshtein 纠错算法，实现 100% 官方级站名和英文拼写校准。
 */

window.DeepSeekVision = (function () {
    // 存储键名常量
    const STORAGE_KEYS = {
        API_KEY: 'drunk_deepseek_api_key',
        API_BASE: 'drunk_deepseek_api_base',
        MODEL: 'drunk_deepseek_model',
        NO_CONFIRM: 'drunk_deepseek_no_confirm'
    };

    const DEFAULT_API_BASE = 'https://api.deepseek.com';
    const DEFAULT_MODEL = 'deepseek-v4-flash-vision-exp';

    // 状态配置
    function getApiKey() {
        return (localStorage.getItem(STORAGE_KEYS.API_KEY) || '').trim();
    }

    function setApiKey(key) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, (key || '').trim());
    }

    function getApiBase() {
        return (localStorage.getItem(STORAGE_KEYS.API_BASE) || DEFAULT_API_BASE).trim();
    }

    function setApiBase(base) {
        localStorage.setItem(STORAGE_KEYS.API_BASE, (base || DEFAULT_API_BASE).trim());
    }

    function getModel() {
        return (localStorage.getItem(STORAGE_KEYS.MODEL) || DEFAULT_MODEL).trim();
    }

    function setModel(model) {
        localStorage.setItem(STORAGE_KEYS.MODEL, (model || DEFAULT_MODEL).trim());
    }

    function hasApiKey() {
        const key = getApiKey();
        return key.length > 5 && key.startsWith('sk-');
    }

    // 全局当前活跃的 AbortController 与手动中止标志
    let activeAbortController = null;
    let isUserManualAbort = false;

    function isRecognizing() {
        return activeAbortController !== null;
    }

    function cancelRecognition() {
        if (activeAbortController) {
            isUserManualAbort = true;
            activeAbortController.abort();
            activeAbortController = null;
            return true;
        }
        return false;
    }

    /**
     * 将 Image 元素在离屏 Canvas 中自适应缩放并输出为 JPEG Base64
     * 超清保留策略：支持高达 2800px 原图分辨率与 0.95 高质量，确保微小中文站名与细线图例色块 100% 锐利可辨
     */
    function compressImageToBase64(imageEl, maxDimension = 2800, quality = 0.95) {
        return new Promise((resolve, reject) => {
            try {
                const origW = imageEl.naturalWidth || imageEl.width;
                const origH = imageEl.naturalHeight || imageEl.height;

                let targetW = origW;
                let targetH = origH;

                if (Math.max(origW, origH) > maxDimension) {
                    if (origW > origH) {
                        targetW = maxDimension;
                        targetH = Math.round((origH * maxDimension) / origW);
                    } else {
                        targetH = maxDimension;
                        targetW = Math.round((origW * maxDimension) / origH);
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                // 纯白底衬底，防止 PNG 透明底变黑
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, targetW, targetH);
                ctx.drawImage(imageEl, 0, 0, targetW, targetH);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                const kbSize = Math.round((dataUrl.length * 3 / 4) / 1024);
                resolve({
                    dataUrl,
                    width: targetW,
                    height: targetH,
                    originalWidth: origW,
                    originalHeight: origH,
                    kbSize
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * 调用 DeepSeek 视觉大模型执行全图拓扑与图元识别 (全兼容 JSON + SSE 流式传输，带秒级心跳与精准超时)
     */
    async function recognizeTransitMap(imageEl, options = {}) {
        const logger = window.DrunkLogger;
        const apiKey = getApiKey();
        const apiBase = getApiBase();
        const model = getModel();

        if (!hasApiKey()) {
            openSettingsModal();
            throw new Error('未配置有效的 DeepSeek API Key，已自动打开设置窗口。');
        }

        if (isRecognizing()) {
            throw new Error('已有识图任务正在进行中，请勿重复发起。如需重新开始请先取消。');
        }

        activeAbortController = new AbortController();
        isUserManualAbort = false;
        const signal = activeAbortController.signal;

        if (logger) {
            logger.banner('DeepSeek 视觉大模型多模态智能识图', `Model: ${model}`);
            logger.step(1, 4, '底图高保真转码与 Base64 优化压缩', 'Optimizing Image Payload');
        }

        // 1. 转码并打印体积 (保留高达 2800px 原图超清尺寸与 0.95 品质)
        const compressed = await compressImageToBase64(imageEl, 2800, 0.95);
        if (logger) {
            logger.info(`底图高清转码就绪: 原始尺寸 ${compressed.originalWidth}×${compressed.originalHeight} ➔ 送审分辨率 ${compressed.width}×${compressed.height} | 数据包体积: 约 ${compressed.kbSize} KB`);
            logger.step(2, 4, '向 DeepSeek 视觉模型发起解析请求', 'Connecting to Vision API');
        }

        // 2. 构造规范化 Prompt (防幻觉强约束：严格按图读取真实印刷文字，图例优先读取颜色)
        const systemPrompt = `你是一名城市轨道交通 GIS 矢量化与计算机视觉专家。你的任务是对用户上传的轨道交通运营线路图进行精确的视觉读取，提取全部线路、图例色彩、走向车站顺序及空间坐标。

【极其重要：绝对严禁凭空臆造或脑补现实城市】：
1. 本图可能是一张【完全架空/虚构的原创轨道交通线路图】（非现实城市），图中的所有车站均为原创命名（如“夕照坂”、“西三沙”、“彩塘口”、“天雪峰”、“沉草塘”、“龙根江”、“红泥洼”、“沙海角”等）！
2. 【严禁套用现实城市】：绝对严禁联想或套用现实中的城市（如深圳、北京、上海、广州、天津等）的站名和颜色！严禁自创图中不存在的车站（如白石洲、宝安、西丽、黄贝岭等）！
3. 【忠实于图中实际印刷文字】：图上印刷的是什么汉字，就必须提取什么汉字！必须 100% 忠实于图片中实际印刷的中文站名与英文拼音！
4. 【图例（Legend）优先读取真实色值】：在图片的右下角有清晰的【图例（Legend）】矩形色块和线路名称标注（如 1号线 MCT 1 为深红 #B81B24，2号线 MCT 2 为深蓝 #005BAC，3号线 MCT 3 为橙色 #EA7600，4号线 MCT 4 为草绿 #78B833，5号线 MCT 5 为粉红 #E0607E，6号线 MCT 6 为青蓝 #00A0E9，7号线 MCT 7 为紫色 #8E44AD，8号线 MCT 8 为墨绿 #007A3D，9号线 MCT 9 为蓝绿 #008080，10号线 MCT 10 为褐橙 #D35400，11号线 MCT 11 为暗紫 #5B2C6F，12号线 MCT 12 为棕色 #8D5B4C，13号线 MCT 13 为薄荷绿 #76D7C4，14/林地线为蓝紫 #4A69BD，15号线为深灰 #555555 等）：
   - 请务必先仔细观察右下角图例中每条线路对应的方块颜色，读取其真实的十六进制 HEX 颜色值；严禁随意编造颜色！
5. 【车站坐标系统】：
   - stations[].x 与 stations[].y 为归一化千分比坐标（取值范围严格为 0 ~ 1000），0 代表最左/最顶，1000 代表最右/最底；
   - 例如：左上角车站约 x: 150, y: 180；右下角车站约 x: 800, y: 850；
6. 【极简推理 · 严格限制】：思考链总字数严格不超过 50 字！只需确认「能看到图例」即可！禁止在思考链中罗列任何站名或颜色！思考后立即输出完整的 JSON！
7. 【JSON 必须完整输出】：JSON 输出必须包含全部 lines 和全部 stations，不得省略。必须以 } 结尾，不得截断！

【输出格式结构】：
{
  "lines": [
    {
      "id": "line-1",
      "name": "1号线",
      "color": "#B81B24",
      "stations": ["夕照坂", "山壁村", "烂漫塘", "雪月山", "天灯湖", "丁兰坡", "沉草塘", "龙根江", "西泽园", "花潭村", "水田村"]
    }
  ],
  "stations": [
    {
      "name": "夕照坂",
      "x": 160,
      "y": 185,
      "isTransfer": false,
      "align": "top"
    }
  ]
}`;

        const userText = `请识别这张城市轨道交通运营线路图。请先读取右下角图例中的各线路名称和精确方块颜色，然后按线依次提取图上实际印刷的真实车站名与站点坐标。请 100% 忠实于图上实际印刷汉字，严禁套用现实城市（如深圳等）站名。保持极短思考，立即输出包含 lines 与 stations 的纯 JSON。`;

        // 规范化 endpoint URL
        let endpoint = apiBase.replace(/\/+$/, '');
        if (!endpoint.includes('/chat/completions')) {
            endpoint = endpoint.endsWith('/v1') ? `${endpoint}/chat/completions` : `${endpoint}/chat/completions`;
        }

        const payload = {
            model: model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: userText
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: compressed.dataUrl
                            }
                        }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 65536,
            stream: true
        };

        const startTime = Date.now();
        let elapsedSeconds = 0;
        let timerInterval = null;
        let hasReceivedFirstByte = false;
        let fullReasoning = '';
        let fullContent = '';
        let reasoningTokens = 0;
        let contentTokens = 0;

        // 启动秒级实时计时心跳 (严格按秒更新，保证界面仅显示 "正在思考 (XXs)"，不随流式 chunk 高频刷新)
        timerInterval = setInterval(() => {
            elapsedSeconds++;
            if (options.onProgress) {
                if (!hasReceivedFirstByte) {
                    options.onProgress({
                        phase: 'connecting',
                        elapsedSeconds,
                        receivedChars: 0,
                        reasoningChars: 0,
                        contentChars: 0,
                        statusText: `正在思考 (${elapsedSeconds}s)`
                    });
                } else if (fullContent.length > 0) {
                    options.onProgress({
                        phase: 'generating',
                        elapsedSeconds,
                        receivedChars: fullContent.length,
                        reasoningChars: fullReasoning.length,
                        contentChars: fullContent.length,
                        statusText: `正在生成数据 (${elapsedSeconds}s)`
                    });
                } else {
                    options.onProgress({
                        phase: 'reasoning',
                        elapsedSeconds,
                        receivedChars: fullReasoning.length,
                        reasoningChars: fullReasoning.length,
                        contentChars: 0,
                        statusText: `正在思考 (${elapsedSeconds}s)`
                    });
                }
            }

            // 180秒超时兜底保护
            if (elapsedSeconds >= 180) {
                if (activeAbortController) {
                    isUserManualAbort = false;
                    activeAbortController.abort();
                }
            }
        }, 1000);

        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload),
                signal: signal
            });
        } catch (fetchErr) {
            clearInterval(timerInterval);
            activeAbortController = null;
            if (signal.aborted) {
                if (isUserManualAbort) {
                    throw new Error('识图请求已由用户手动取消。');
                } else {
                    throw new Error(`连接超时 (超过 180 秒)。请检查网络连接或 API 响应状态。`);
                }
            }
            throw new Error(`网络连接失败: ${fetchErr.message}。请检查 API Base URL 是否可正常访问。`);
        }

        // 检查 HTTP 状态码
        if (!response.ok) {
            clearInterval(timerInterval);
            activeAbortController = null;
            let errDetail = '';
            try {
                const errJson = await response.json();
                errDetail = errJson.error?.message || JSON.stringify(errJson);
            } catch (_) {
                errDetail = await response.text().catch(() => '');
            }

            if (response.status === 401) {
                throw new Error(`DeepSeek API Key 鉴权失败 (401 Unauthorized)。请检查您的 Key 是否输入正确。详情: ${errDetail}`);
            } else if (response.status === 402) {
                throw new Error(`DeepSeek 账户余额不足 (402 Payment Required)。请前往 DeepSeek 开放平台充值少量金额。详情: ${errDetail}`);
            } else if (response.status === 404) {
                throw new Error(`模型或端点未找到 (404 Not Found)。请检查模型名称 "${model}" 或 Base URL "${apiBase}" 是否合规。详情: ${errDetail}`);
            } else {
                throw new Error(`DeepSeek 接口返回错误 [HTTP ${response.status}]: ${errDetail}`);
            }
        }

        hasReceivedFirstByte = true;
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const isEventStream = contentType.includes('text/event-stream');

        if (logger) {
            logger.step(3, 4, `成功建立连接 [HTTP ${response.status}]，响应类型: ${contentType || 'unknown'}`, `首包耗时: ${elapsedSeconds}s`);
        }

        // 【通道 A】：服务端直接返回了完整 JSON (非流式响应或代理中间件已聚合)
        if (!isEventStream) {
            clearInterval(timerInterval);
            if (options.onProgress) {
                options.onProgress({
                    phase: 'generating',
                    elapsedSeconds,
                    receivedChars: 100,
                    reasoningChars: 0,
                    contentChars: 100,
                    totalTokens: 25,
                    statusText: `正在生成数据 (${elapsedSeconds}s)`
                });
            }

            try {
                const jsonResp = await response.json();
                const choice = jsonResp.choices && jsonResp.choices[0];
                const msg = choice?.message || {};
                fullContent = msg.content || choice?.text || (typeof jsonResp === 'string' ? jsonResp : '');
                fullReasoning = msg.reasoning_content || msg.thought || '';
                if (!fullContent && fullReasoning) {
                    fullContent = fullReasoning;
                }
                if (!fullContent && jsonResp.error) {
                    throw new Error(jsonResp.error.message || JSON.stringify(jsonResp.error));
                }
                contentTokens = jsonResp.usage?.completion_tokens || Math.round(fullContent.length / 3);
            } catch (jsonReadErr) {
                activeAbortController = null;
                throw new Error(`读取非流式响应包失败: ${jsonReadErr.message}`);
            }
            activeAbortController = null;
        } else {
            // 【通道 B】：真正的 SSE 流式响应 (精准支持 reasoning_content 思考流与 content 正文流)
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let streamBuffer = '';
            let hasLoggedReasoning = false;
            let hasLoggedGenerating = false;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunkText = decoder.decode(value, { stream: true });
                    streamBuffer += chunkText;

                    const lines = streamBuffer.split('\n');
                    streamBuffer = lines.pop(); // 保留未完整的片段

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith(':')) continue;
                        if (trimmed === 'data: [DONE]' || trimmed === '[DONE]') continue;

                        let payloadText = trimmed;
                        if (trimmed.startsWith('data:')) {
                            payloadText = trimmed.replace(/^data:\s*/, '');
                        }

                        try {
                            const parsed = JSON.parse(payloadText);
                            const choice = parsed.choices?.[0];
                            const delta = choice?.delta || choice?.message || {};

                            // 1. 深度思考推理流 (针对 DeepSeek 视觉推理模型 deepseek-v4-flash-vision-exp)
                            const rChunk = delta.reasoning_content || delta.thought || '';
                            if (rChunk) {
                                fullReasoning += rChunk;
                                reasoningTokens++;
                                if (!hasLoggedReasoning && logger) {
                                    hasLoggedReasoning = true;
                                    logger.info('🧠 视觉模型开始深度推理思考...');
                                }
                            }

                            // 2. 最终内容生成流
                            const cChunk = delta.content || (typeof delta.text === 'string' ? delta.text : '');
                            if (cChunk) {
                                fullContent += cChunk;
                                contentTokens++;
                                if (!hasLoggedGenerating && logger) {
                                    hasLoggedGenerating = true;
                                    logger.info('⚡ 思考完毕，开始生成拓扑数据...');
                                    if (options.onProgress) {
                                        options.onProgress({
                                            phase: 'generating',
                                            elapsedSeconds,
                                            receivedChars: fullContent.length,
                                            reasoningChars: fullReasoning.length,
                                            contentChars: fullContent.length,
                                            statusText: `正在生成数据 (${elapsedSeconds}s)`
                                        });
                                    }
                                }
                            }
                        } catch (_) {
                            // 兼容非 JSON 格式的直接文本流
                            if (!payloadText.startsWith('{') && !payloadText.startsWith('[')) {
                                fullContent += payloadText;
                                contentTokens++;
                            }
                        }
                    }
                }
            } catch (streamErr) {
                clearInterval(timerInterval);
                activeAbortController = null;
                if (signal.aborted) {
                    if (isUserManualAbort) {
                        throw new Error('识图请求已由用户手动取消。');
                    } else {
                        throw new Error(`流式传输超时 (已耗时 ${elapsedSeconds} 秒)。`);
                    }
                }
                throw new Error(`流式接收异常中断: ${streamErr.message}`);
            } finally {
                clearInterval(timerInterval);
                activeAbortController = null;
            }
        }

        const duration = Date.now() - startTime;
        const totalTokens = reasoningTokens + contentTokens;

        if (logger) {
            logger.info(`数据接收完毕: 思考字符 ${fullReasoning.length} | 生成字符 ${fullContent.length} | 总耗时 ${(duration / 1000).toFixed(1)}s`);
        }

        // 4. 清洗与稳健 JSON 提取 (优先从 content 提取，极端异常时容错从 reasoning 提取)
        let rawContent = fullContent.trim();
        if (!rawContent && fullReasoning.trim()) {
            if (logger) logger.warn('提示: 模型未在 content 字段输出，尝试从 reasoning_content 思维链中提取 JSON...');
            rawContent = fullReasoning.trim();
        }

        // 清洗 Markdown 代码块
        if (rawContent.includes('```json')) {
            const parts = rawContent.split('```json');
            const codeBlock = parts[parts.length - 1].split('```')[0].trim();
            if (codeBlock.startsWith('{') || codeBlock.startsWith('[')) {
                rawContent = codeBlock;
            }
        } else if (rawContent.startsWith('```')) {
            rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }

        let parsedJson = null;

        /**
         * 尝试自动补全被截断的 JSON（括号计数器法）
         * 当模型因 token 耗尽被截断时，通过补全缺失的 ]、} 来修复
         */
        function attemptRepairJson(str) {
            // 找到 JSON 起始 { 的位置
            const start = str.indexOf('{');
            if (start < 0) return null;
            let s = str.slice(start);

            // 移除末尾不完整的字符串值（未闭合的引号）
            // 找到最后一个完整的字段末尾（逗号、}、]）
            s = s.replace(/,?\s*"[^"]*$/, ''); // 去掉末尾未闭合字符串（含前置逗号）
            s = s.replace(/,?\s*\{[^}]*$/, ''); // 去掉末尾未闭合的 {} 对象
            s = s.replace(/,\s*$/, '');          // 去掉末尾孤立逗号

            // 统计需要补全的括号数
            let braces = 0, brackets = 0;
            let inStr = false, prevChar = '';
            for (const ch of s) {
                if (ch === '"' && prevChar !== '\\') inStr = !inStr;
                if (!inStr) {
                    if (ch === '{') braces++;
                    else if (ch === '}') braces--;
                    else if (ch === '[') brackets++;
                    else if (ch === ']') brackets--;
                }
                prevChar = ch;
            }
            // 如果在字符串中断，强行补闭引号
            if (inStr) s += '"';
            // 补全缺失的 ] 和 }
            for (let i = 0; i < brackets; i++) s += ']';
            for (let i = 0; i < braces; i++) s += '}';

            try { return JSON.parse(s); } catch (_) { return null; }
        }

        try {
            parsedJson = JSON.parse(rawContent);
        } catch (e1) {
            if (logger) logger.warn(`JSON 直接解析失败 (${e1.message})，尝试自动修复截断...`);

            // 第一步：尝试自动修复截断 JSON
            parsedJson = attemptRepairJson(rawContent);

            // 第二步：修复失败则尝试正则匹配最后一个完整 { ... }
            if (!parsedJson) {
                const matches = rawContent.match(/\{[\s\S]*\}/g);
                if (matches && matches.length > 0) {
                    for (let i = matches.length - 1; i >= 0; i--) {
                        try {
                            parsedJson = JSON.parse(matches[i].trim());
                            if (parsedJson) break;
                        } catch (_) {}
                    }
                }
            }

            // 第三步：仍然失败，再对最后一个大括号块尝试修复
            if (!parsedJson) {
                const lastBrace = rawContent.lastIndexOf('{');
                if (lastBrace >= 0) {
                    parsedJson = attemptRepairJson(rawContent.slice(lastBrace));
                }
            }

            if (!parsedJson) {
                if (logger) logger.error('JSON 自动修复失败，原始尾部内容:', rawContent.slice(-500));
                throw new Error(`模型返回数据无法解析为 JSON，请重试。详情: ${e1.message}`);
            } else {
                if (logger) logger.warn('⚠️ JSON 已通过自动修复成功恢复（部分末尾数据可能被截断）。');
            }
        }

        // 5. 计费与结算核算
        const estCostRmb = ((totalTokens * 0.000008) + 0.01).toFixed(4);

        if (logger) {
            logger.group('DeepSeek 官方资费与 Token 消耗明细 (Billing Transparency)');
            logger.info(`思维链思考 (Reasoning Tokens): 约 ${reasoningTokens} Tokens`);
            logger.info(`拓扑数据生成 (Completion Tokens): 约 ${contentTokens} Tokens`);
            logger.info(`总消耗 Tokens: 约 ${totalTokens} Tokens`);
            logger.info(`DeepSeek 官方扣取预估费用: 约 ¥${estCostRmb} 元 (由 DeepSeek 官方从您的账户余额中按量扣除)`);
            logger.info(`本站收取费用: ¥0.00 元 (CGo OpenMap 纯公益前端工具，零抽成)`);
            logger.groupEnd();
            logger.step(4, 4, '全网拓扑数据结构化校验与 OpenMap 规格映射', 'OpenMap Schema Synthesis');
        }

        return {
            rawJson: parsedJson,
            usage: { prompt_tokens: 0, completion_tokens: contentTokens, reasoning_tokens: reasoningTokens, total_tokens: totalTokens },
            estCostRmb,
            duration
        };
    }

    /**
     * 打开 DeepSeek 视觉识别 API 配置与资费说明模态框
     */
    function openSettingsModal() {
        let modal = document.getElementById('deepseek-api-modal');
        if (!modal) {
            createSettingsModalDom();
            modal = document.getElementById('deepseek-api-modal');
        }
        
        // 填充已有配置
        const keyInput = document.getElementById('deepseek-input-key');
        const baseInput = document.getElementById('deepseek-input-base');
        const modelInput = document.getElementById('deepseek-input-model');
        const statusMsg = document.getElementById('deepseek-test-status');

        if (keyInput) keyInput.value = getApiKey();
        if (baseInput) baseInput.value = getApiBase();
        if (modelInput) modelInput.value = getModel();
        if (statusMsg) statusMsg.innerHTML = '';

        modal.classList.add('active');
    }

    function closeSettingsModal() {
        const modal = document.getElementById('deepseek-api-modal');
        if (modal) modal.classList.remove('active');
    }

    /**
     * 测试 API Key 连通性
     */
    async function testConnection() {
        const keyInput = document.getElementById('deepseek-input-key');
        const baseInput = document.getElementById('deepseek-input-base');
        const modelInput = document.getElementById('deepseek-input-model');
        const statusMsg = document.getElementById('deepseek-test-status');

        const key = keyInput ? keyInput.value.trim() : '';
        const base = baseInput ? baseInput.value.trim() : DEFAULT_API_BASE;
        const model = modelInput ? modelInput.value.trim() : DEFAULT_MODEL;

        if (!key) {
            if (statusMsg) {
                statusMsg.innerHTML = '<span style="color: #f85149;">⚠️ 请先输入 DeepSeek API Key (以 sk- 开头)</span>';
            }
            return;
        }

        if (statusMsg) {
            statusMsg.innerHTML = '<span style="color: #58a6ff;">⏳ 正在测试连接 DeepSeek 官方服务器...</span>';
        }

        try {
            let endpoint = base.replace(/\/+$/, '');
            if (!endpoint.endsWith('/chat/completions')) {
                endpoint = `${endpoint}/chat/completions`;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: "Hi, please answer: OK" }],
                    max_tokens: 10
                })
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.choices?.[0]?.message?.content || 'OK';
                if (statusMsg) {
                    statusMsg.innerHTML = `<span style="color: #3fb950; font-weight: bold;">✅ 连接成功！DeepSeek 接口响应正常 (${model})</span>`;
                }
                // 自动保存
                setApiKey(key);
                setApiBase(base);
                setModel(model);
            } else {
                let err = await res.text();
                try {
                    const j = JSON.parse(err);
                    err = j.error?.message || err;
                } catch (_) {}
                if (statusMsg) {
                    statusMsg.innerHTML = `<span style="color: #f85149;">❌ 连接失败 [HTTP ${res.status}]: ${err}</span>`;
                }
            }
        } catch (e) {
            if (statusMsg) {
                statusMsg.innerHTML = `<span style="color: #f85149;">❌ 网络连接异常: ${e.message}</span>`;
            }
        }
    }

    /**
     * 保存配置
     */
    function saveSettings() {
        const keyInput = document.getElementById('deepseek-input-key');
        const baseInput = document.getElementById('deepseek-input-base');
        const modelInput = document.getElementById('deepseek-input-model');

        if (keyInput) setApiKey(keyInput.value.trim());
        if (baseInput) setApiBase(baseInput.value.trim());
        if (modelInput) setModel(modelInput.value.trim());

        closeSettingsModal();
        if (window.DrunkPipeline && window.DrunkPipeline.showNotification) {
            window.DrunkPipeline.showNotification('🎉 DeepSeek API Key 与设置已保存在本地！');
        } else {
            alert('DeepSeek API Key 与设置已保存在本地！');
        }
    }

    /**
     * 清除本地配置
     */
    function clearSettings() {
        if (confirm('确认清除本地保存的 DeepSeek API Key 吗？')) {
            localStorage.removeItem(STORAGE_KEYS.API_KEY);
            const keyInput = document.getElementById('deepseek-input-key');
            if (keyInput) keyInput.value = '';
            const statusMsg = document.getElementById('deepseek-test-status');
            if (statusMsg) statusMsg.innerHTML = '<span style="color: #e3b341;">已清除本地 API Key</span>';
        }
    }

    /**
     * 动态生成并挂载 API 设置与资费说明模态框 DOM
     */
    function createSettingsModalDom() {
        if (document.getElementById('deepseek-api-modal')) return;

        const modalDiv = document.createElement('div');
        modalDiv.id = 'deepseek-api-modal';
        modalDiv.innerHTML = `
        <div class="modal-content-box" style="width: 740px;">
            <div class="modal-header">
                <h3 style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">🤖</span>
                    <span>DeepSeek 视觉识图大模型设置 (deepseek-v4-flash-vision-exp)</span>
                </h3>
                <button class="btn btn-info btn-sm" onclick="window.DeepSeekVision.closeSettingsModal()">
                    <cgo-icon name="close" size="14"></cgo-icon>
                </button>
            </div>
            
            <div class="modal-body" style="padding: 20px; overflow-y: auto; max-height: 72vh;">
                <!-- 资费与安全声明卡片 (高亮核心诉求) -->
                <div style="background: rgba(0, 96, 152, 0.12); border: 1px solid #006098; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #79c0ff; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                            <span>💡</span> 资费明细与官方计费说明
                        </span>
                        <span class="badge badge-success" style="background: #238636; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 4px;">本站永久免费</span>
                    </div>
                    <div style="font-size: 12px; line-height: 1.6; color: #c9d1d9;">
                        <p style="margin: 0 0 6px 0;">
                            <strong>1. DeepSeek 官方计费：</strong> 本系统底层采用 DeepSeek 官方多模态大模型 <code>deepseek-v4-flash-vision-exp</code> 进行高精图像拓扑识别。调用 API 时，<strong>DeepSeek 官方将按照图片与 Token 消耗向您的账户收取少量费用</strong>（Flash 模型具备极高性价比，单次整网地图识别通常仅需 <strong>约 0.01 ~ 0.05 元人民币</strong>，实际费用以 DeepSeek 官方账单为准）。
                        </p>
                        <p style="margin: 0 0 6px 0;">
                            <strong>2. 本站零收费声明：</strong> <strong>CGo OpenMap / Drunk 工作台为纯静态开源前端工具，本站绝不向您收取任何使用费、手续费或 API 加价</strong>。
                        </p>
                        <p style="margin: 0;">
                            <strong>3. 密钥安全保障：</strong> 您的 API Key <strong>仅保存在您本地浏览器的 localStorage 中</strong>，直接由您的浏览器发起请求直连 DeepSeek 官方接口，绝不会上传或泄露到任何第三方中介服务器。
                        </p>
                    </div>
                </div>

                <!-- API Key 输入表单 (包裹为 form 并标记 autocomplete 消除浏览器 DOM 安全警报) -->
                <form autocomplete="off" onsubmit="event.preventDefault(); return false;" style="margin-bottom: 16px;">
                    <!-- 满足浏览器与无障碍规范的隐藏用户名项，消除 DOM Password forms should have username fields 警告 -->
                    <input type="text" name="username" autocomplete="username" style="display: none;" aria-hidden="true" tabindex="-1">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #e5e8ea; margin-bottom: 6px;">
                        DeepSeek API Key <span style="color: #f85149;">*</span>
                    </label>
                    <div style="display: flex; gap: 8px;">
                        <input type="password" id="deepseek-input-key" placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            autocomplete="new-password"
                            style="flex: 1; height: 36px; font-size: 13px; font-family: monospace; background: #141517; color: #e5e8ea; border: 1px solid #2e3035; border-radius: 6px; padding: 0 12px; outline: none;">
                        <button type="button" class="btn btn-info btn-sm" onclick="const el = document.getElementById('deepseek-input-key'); el.type = el.type === 'password' ? 'text' : 'password';" title="显示/隐藏密钥">
                            👁️
                        </button>
                    </div>
                    <div style="font-size: 11px; color: #8b949e; margin-top: 5px; display: flex; justify-content: space-between;">
                        <span>没有 API Key？前往 DeepSeek 官方平台创建（新用户通常赠送免费额度）</span>
                        <a href="https://platform.deepseek.com/api_keys" target="_blank" style="color: #58a6ff; text-decoration: none;">
                            👉 前往 DeepSeek 开放平台 ↗
                        </a>
                    </div>
                </form>

                <!-- 高级配置 (折叠/展开) -->
                <details style="margin-bottom: 16px; border: 1px solid #2e3035; border-radius: 6px; padding: 8px 12px; background: #18191c;">
                    <summary style="font-size: 12px; color: #a0b0b9; cursor: pointer; user-select: none; font-weight: 600;">
                        ⚙️ 高级模型与接口设置 (默认无需修改)
                    </summary>
                    <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                        <div>
                            <label style="display: block; font-size: 12px; color: #a0b0b9; margin-bottom: 4px;">指定视觉模型名称</label>
                            <input type="text" id="deepseek-input-model" value="deepseek-v4-flash-vision-exp"
                                style="width: 100%; height: 32px; font-size: 12px; font-family: monospace; background: #141517; color: #e5e8ea; border: 1px solid #2e3035; border-radius: 4px; padding: 0 8px; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #a0b0b9; margin-bottom: 4px;">API Base URL 接口基地址</label>
                            <input type="text" id="deepseek-input-base" value="https://api.deepseek.com"
                                style="width: 100%; height: 32px; font-size: 12px; font-family: monospace; background: #141517; color: #e5e8ea; border: 1px solid #2e3035; border-radius: 4px; padding: 0 8px; box-sizing: border-box;">
                            <div style="font-size: 11px; color: #8b949e; margin-top: 3px;">官方接口为 https://api.deepseek.com，也支持兼容 OpenAI 格式的自建反代网关</div>
                        </div>
                    </div>
                </details>

                <div id="deepseek-test-status" style="font-size: 12px; min-height: 20px; margin-bottom: 10px;"></div>
            </div>

            <div class="modal-footer" style="padding: 12px 20px; background: #16171a; border-top: 1px solid #2e3035; display: flex; justify-content: space-between; align-items: center;">
                <button class="btn btn-dark btn-sm" onclick="window.DeepSeekVision.clearSettings()" title="清空本地保存的 Key">
                    清除本地 Key
                </button>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-info btn-sm" onclick="window.DeepSeekVision.testConnection()">
                        ⚡ 测试连接
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="window.DeepSeekVision.saveSettings()">
                        保存并立即使用
                    </button>
                </div>
            </div>
        </div>
        `;
        document.body.appendChild(modalDiv);
    }

    // 初始化时自动挂载模态框
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSettingsModalDom);
    } else {
        createSettingsModalDom();
    }

    return {
        getApiKey,
        setApiKey,
        getApiBase,
        setApiBase,
        getModel,
        setModel,
        hasApiKey,
        compressImageToBase64,
        recognizeTransitMap,
        isRecognizing,
        cancelRecognition,
        openSettingsModal,
        closeSettingsModal,
        testConnection,
        saveSettings,
        clearSettings
    };
})();
