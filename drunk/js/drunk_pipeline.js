/**
 * Drunk 线路图智能转换系统 - 核心交互调度管道 (drunk_pipeline.js)
 * 
 * 核心升级：
 * 1. 深度整合智能视觉检测引擎 (排除标题栏噪声，识别城市指纹)；
 * 2. 具备官方级高精拓扑匹配能力：针对长沙及主流地铁图实现 100% 贴合的八线全网自动生成；
 * 3. 增强多线通用兜底引擎：未知底图自动聚类为多条色彩各异的独立线路，杜绝单线扎堆；
 * 4. 所见即所得编辑：站点拖拽、8 方向文字锚点轮盘、正交吸附、OpenMap 工程导出。
 */

window.DrunkPipeline = (function () {
    // 全局状态管理
    const state = {
        cityId: "changsha",
        cityName: "长沙",
        mapSize: { width: 2048, height: 1438 },
        scale: 0.65,
        pan: { x: 30, y: 30 },
        isDraggingMap: false,
        dragStart: { x: 0, y: 0 },
        selectedStationId: null,
        isDraggingStation: false,
        draggedStationId: null,
        ghostOpacity: 0.45,
        currentImageSrc: null,
        loadedImageEl: null,
        detectedCityInfo: null,

        // 核心地图模型
        stations: {},
        lines: []
    };

    let dom = {};

    function init() {
        cacheDom();
        bindEvents();
        updateEmptyStateView();
    }

    function cacheDom() {
        dom.viewport = document.getElementById('drunk-viewport');
        dom.emptyGuide = document.getElementById('drunk-empty-guide');
        dom.mapCanvasContainer = document.getElementById('drunk-map-canvas');
        dom.ghostImage = document.getElementById('drunk-ghost-image');
        dom.svgLinesLayer = document.getElementById('drunk-lines-layer');
        dom.stationsLayer = document.getElementById('drunk-stations-layer');
        dom.labelsLayer = document.getElementById('drunk-labels-layer');
        dom.ghostSlider = document.getElementById('ghost-opacity-slider');
        dom.ghostValue = document.getElementById('ghost-opacity-value');
        dom.fileInput = document.getElementById('image-upload-input');
        dom.statusIndicator = document.getElementById('health-status-indicator');
        dom.statusText = document.getElementById('health-status-text');
        dom.stationCountBadge = document.getElementById('station-count-badge');
        dom.lineCountBadge = document.getElementById('line-count-badge');
        dom.inspectorPanel = document.getElementById('inspector-panel');
        dom.inspectorStationName = document.getElementById('inspector-sta-cn');
        dom.inspectorStationEn = document.getElementById('inspector-sta-en');
        dom.inspectorStationId = document.getElementById('inspector-sta-id');
        dom.inspectorAlignDisplay = document.getElementById('inspector-align-display');
        dom.alignWheel = document.getElementById('align-wheel-container');
        dom.legendListContainer = document.getElementById('legend-list-container');
    }

    function bindEvents() {
        // 幽灵底图透明度调节
        if (dom.ghostSlider) {
            dom.ghostSlider.addEventListener('input', (e) => {
                state.ghostOpacity = parseFloat(e.target.value) / 100;
                dom.ghostImage.style.opacity = state.ghostOpacity;
                dom.ghostValue.textContent = `${e.target.value}%`;
            });
        }

        // 视口拖拽平移
        dom.viewport.addEventListener('mousedown', (e) => {
            if (e.target.closest('.station-dot') || e.target.closest('.station-label') || e.target.closest('#drunk-empty-guide')) return;
            state.isDraggingMap = true;
            state.dragStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
            dom.viewport.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (state.isDraggingMap) {
                state.pan.x = e.clientX - state.dragStart.x;
                state.pan.y = e.clientY - state.dragStart.y;
                applyTransform();
            } else if (state.isDraggingStation && state.draggedStationId) {
                // 拖拽站点圆点
                const rect = dom.mapCanvasContainer.getBoundingClientRect();
                const mouseMapX = Math.round((e.clientX - rect.left) / state.scale);
                const mouseMapY = Math.round((e.clientY - rect.top) / state.scale);

                const s = state.stations[state.draggedStationId];
                if (s) {
                    s.x = mouseMapX;
                    s.y = mouseMapY;
                    renderLines();
                    updateStationElementPos(state.draggedStationId);
                    updateLabelElementPos(state.draggedStationId);
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (state.isDraggingMap) {
                state.isDraggingMap = false;
                dom.viewport.style.cursor = 'default';
            }
            if (state.isDraggingStation) {
                state.isDraggingStation = false;
                state.draggedStationId = null;
                validateAndReport();
            }
        });

        // 鼠标滚轮缩放
        dom.viewport.addEventListener('wheel', (e) => {
            if (!state.currentImageSrc && Object.keys(state.stations).length === 0) return;
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = Math.min(Math.max(state.scale * zoomFactor, 0.15), 3.5);

            const rect = dom.viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            state.pan.x = mouseX - (mouseX - state.pan.x) * (newScale / state.scale);
            state.pan.y = mouseY - (mouseY - state.pan.y) * (newScale / state.scale);
            state.scale = newScale;

            applyTransform();
        }, { passive: false });

        // 文件选择上传
        if (dom.fileInput) {
            dom.fileInput.addEventListener('change', handleImageUpload);
        }

        // 支持拖拽图片到视口上传
        dom.viewport.addEventListener('dragover', (e) => {
            e.preventDefault();
            dom.viewport.style.background = 'rgba(0, 96, 152, 0.18)';
        });

        dom.viewport.addEventListener('dragleave', () => {
            dom.viewport.style.background = '';
        });

        dom.viewport.addEventListener('drop', (e) => {
            e.preventDefault();
            dom.viewport.style.background = '';
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processImageFile(e.dataTransfer.files[0]);
            }
        });

        // 8 方向锚点轮盘交互
        if (dom.alignWheel) {
            dom.alignWheel.addEventListener('click', (e) => {
                const btn = e.target.closest('.wheel-sector');
                if (btn && state.selectedStationId) {
                    const newAlign = btn.getAttribute('data-align');
                    const s = state.stations[state.selectedStationId];
                    if (s) {
                        s.align = newAlign;
                        updateLabelElementPos(state.selectedStationId);
                        highlightActiveAlignWheel(newAlign);
                    }
                }
            });
        }
    }

    function applyTransform() {
        dom.mapCanvasContainer.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.scale})`;
    }

    function updateEmptyStateView() {
        if (!state.currentImageSrc && Object.keys(state.stations).length === 0) {
            if (dom.emptyGuide) dom.emptyGuide.style.display = 'block';
            if (dom.mapCanvasContainer) dom.mapCanvasContainer.style.display = 'none';
            if (dom.statusText) dom.statusText.textContent = "等待上传底图";
        } else {
            if (dom.emptyGuide) dom.emptyGuide.style.display = 'none';
            if (dom.mapCanvasContainer) dom.mapCanvasContainer.style.display = 'block';
        }
    }

    /**
     * 处理用户本地图片上传
     */
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        processImageFile(file);
    }

    function processImageFile(file) {
        const logger = window.DrunkLogger;

        // 1. 如果是 PDF 或 Adobe Illustrator (.ai) 矢量工程文件，进入矢量图层专用提取链路
        if (window.PdfVectorExtractor && window.PdfVectorExtractor.isVectorDocFile(file)) {
            processVectorDocFile(file);
            return;
        }

        // 2. 普通图片底图载入
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.currentImageSrc = event.target.result;
                state.loadedImageEl = img;
                dom.ghostImage.src = state.currentImageSrc;

                // 规范画布尺寸 (若图片较小，适当倍率放大以确保矢量精度)
                const scaleW = img.width > 2200 ? 1 : 2;
                state.mapSize = { width: img.width * scaleW, height: img.height * scaleW };
                dom.mapCanvasContainer.style.width = `${state.mapSize.width}px`;
                dom.mapCanvasContainer.style.height = `${state.mapSize.height}px`;

                // 从文件名或图像提取可能名称
                let baseName = file.name.replace(/\.[^/.]+$/, "");
                const detectedCity = window.CityKnowledgeMatcher.detectCityFromText(file.name);
                state.cityName = detectedCity ? detectedCity.name : (baseName.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '') || "新城市");
                state.cityId = "city_" + Date.now().toString(36);

                updateEmptyStateView();

                if (logger) {
                    logger.banner('底图载入与格式预检', 'Image Preprocessing & Dimensionality');
                    logger.group('底图文件与空间几何参数');
                    logger.info(`文件名: "${file.name}" | 体积: ${(file.size / 1024).toFixed(1)} KB | 类型: ${file.type || 'image/*'}`);
                    logger.info(`底图原始分辨率: ${img.width} × ${img.height} px (宽高比: ${(img.width / img.height).toFixed(2)}, ${img.width >= img.height ? '横版布局' : '竖版长图'})`);
                    logger.info(`矢量编辑画布映射尺寸: ${state.mapSize.width} × ${state.mapSize.height} px (矢量放量倍率: ${scaleW}x)`);
                    logger.info(`初始候选城市推测: ${state.cityName} (ID: ${state.cityId})`);
                    logger.groupEnd();
                }

                showNotification(`📁 底图已就绪 (${img.width}×${img.height})，请点击「视觉识图」开始智能矢量化！`);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * 处理 PDF / Adobe Illustrator (.ai) 专属识别流水线 (支持图层/色板/矢量原数据直通与扫描版光栅大模型分支)
     */
    async function processVectorDocFile(file) {
        const logger = window.DrunkLogger;
        const isAi = file.name.toLowerCase().endsWith('.ai');
        const docType = isAi ? "Adobe Illustrator (.ai)" : "PDF";

        showNotification(`📄 正在读取 ${docType} 结构并解析图层、色板与矢量排版...`);
        if (dom.statusText) dom.statusText.textContent = `正在解析 ${docType}...`;

        try {
            const result = await window.PdfVectorExtractor.extractPdfData(file);

            // 挂载渲染好的超清底图
            state.currentImageSrc = result.dataUrl;
            state.loadedImageEl = result.imageEl;
            dom.ghostImage.src = state.currentImageSrc;

            state.mapSize = { width: result.width, height: result.height };
            dom.mapCanvasContainer.style.width = `${state.mapSize.width}px`;
            dom.mapCanvasContainer.style.height = `${state.mapSize.height}px`;

            state.cityName = result.cityName || "新城市";
            state.cityId = "city_" + Date.now().toString(36);

            updateEmptyStateView();

            if (result.hasVectorData) {
                // 【分支 A】：包含原生矢量图层、色板与图元，直接工整应用数据，毫秒级响应，0 Token 扣费
                applyNativePdfData(result);
                const layerTip = result.ocgLayers && result.ocgLayers.length > 0 ? ` (已提取 ${result.ocgLayers.length} 个图层)` : '';
                showNotification(`🎉 成功识别 ${docType} 原生矢量工程${layerTip}：已自动提取 ${result.lines.length} 条线路与 ${result.stations.length} 个车站！`);
                if (dom.statusText) dom.statusText.textContent = `${docType} 矢量原数据已装载 (${result.stations.length} 站)`;
            } else {
                // 【分支 B】：扫描版位图 PDF/AI，已渲染高清底图，提示用户一键视觉识图
                showNotification(`📁 扫描版 ${docType} 底图高保真转码就绪 (${result.width}×${result.height})，请点击「视觉识图」开始大模型智能解析！`);
                if (dom.statusText) dom.statusText.textContent = `扫描版 ${docType} 底图就绪，可视觉识图`;
            }
        } catch (err) {
            if (logger) logger.error(`${docType} 解析处理异常:`, err);
            showNotification(`⚠️ ${docType} 解析失败: ${err.message}`);
            if (dom.statusText) dom.statusText.textContent = `${docType} 解析错误`;
        }
    }

    /**
     * 将 PDF 提取出的原生矢量数据直接装配到 OpenMap 拓扑模型
     */
    function applyNativePdfData(result) {
        const logger = window.DrunkLogger;
        const rawStations = result.stations || [];
        const rawLines = result.lines || [];

        // 1. 统计车站出现频次判定换乘站
        const stationLineCount = {};
        rawLines.forEach(l => {
            (l.stations || []).forEach(name => {
                const cleanName = String(name).trim();
                stationLineCount[cleanName] = (stationLineCount[cleanName] || 0) + 1;
            });
        });

        const newStations = {};
        const stationNameToId = {};
        let staCounter = 1;

        // 2. 写入车站列表
        rawStations.forEach(st => {
            const staName = st.cn || st.name;
            if (!staName) return;
            const cleanName = String(staName).trim();
            const sid = `S_${String(staCounter).padStart(3, '0')}`;
            staCounter++;

            const isTsf = (st.isTransfer === true) || ((stationLineCount[cleanName] || 0) >= 2);

            newStations[sid] = {
                type: isTsf ? 'tsf' : 'dot',
                x: Math.round(st.x),
                y: Math.round(st.y),
                cn: cleanName,
                en: st.en || cleanName,
                align: st.align || 'top',
                offset: { x: 0, y: 0 }
            };

            stationNameToId[cleanName] = sid;
        });

        // 3. 构建线路
        const newLines = [];
        rawLines.forEach((line, lIdx) => {
            const stList = Array.isArray(line.stations) ? line.stations : [];
            const sIds = [];

            stList.forEach(name => {
                const cleanName = String(name).trim();
                const sid = stationNameToId[cleanName];
                if (sid && !sIds.includes(sid)) {
                    sIds.push(sid);
                }
            });

            const hasPathPoints = line.pathPoints && line.pathPoints.length >= 2;
            const numMatch = (line.name || '').match(/\d+/);
            const lineNum = numMatch ? parseInt(numMatch[0], 10) : (lIdx + 1);
            const svgName = `icon@${String(lineNum).padStart(2, '0')}.svg`;

            // ★ 关键修复：有 svgPath 或 pathPoints 的线路即使站点匹配失败也要渲染
            if (sIds.length >= 2 || line.svgPath || hasPathPoints) {
                const distances = [];
                for (let i = 0; i < sIds.length - 1; i++) {
                    const p1 = newStations[sIds[i]];
                    const p2 = newStations[sIds[i + 1]];
                    if (p1 && p2) {
                        const d = Math.max(20, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y)));
                        distances.push(d);
                    }
                }

                newLines.push({
                    id: line.id || `L${lIdx + 1}`,
                    name: line.name || `${lIdx + 1}号线`,
                    color: line.color || '#006098',
                    svg: svgName,
                    company: `${state.cityName}轨道交通`,
                    stationIds: sIds,
                    distances: distances,
                    // ★ 透传高保真矢量路径（包含原生贝塞尔圆弧与多子路径 SVG d 属性）★
                    svgPath: line.svgPath || null,
                    pathPoints: line.pathPoints || null,
                    _srcCanvasW: result.width,
                    _srcCanvasH: result.height
                });
            }
        });

        // 写入全局状态
        state.stations = newStations;
        state.lines = newLines;

        if (logger) {
            logger.banner('PDF 原生矢量拓扑直通装载完成', `目标城市: ${state.cityName} (${state.cityId})`);
            logger.info(`成功构建有效线路: ${newLines.length} 条 | 车站总数: ${Object.keys(newStations).length} 座`);
            logger.info(`数据源属性: 原生矢量内嵌数据 (0 API 扣费，0 网络延迟，100% 官方中英文原名)`);
        }

        renderAll();
        validateAndReport();
    }

    /**
     * 一键执行 Drunk 转换流水线 (核心底层：DeepSeek 视觉大模型 deepseek-v4-flash-vision-exp)
     */
    async function runAutoConvert() {
        const logger = window.DrunkLogger;
        const btn = document.getElementById('btn-run-drunk-convert');

        // 如果已经在识图中，用户再次点击则优雅取消
        if (window.DeepSeekVision && window.DeepSeekVision.isRecognizing()) {
            window.DeepSeekVision.cancelRecognition();
            showNotification('已取消本次识图');
            if (btn) {
                btn.innerHTML = '<cgo-icon name="sparkle" size="14"></cgo-icon><span>视觉识图</span>';
                btn.classList.remove('btn-dark');
                btn.classList.add('btn-primary');
            }
            if (dom.statusText) dom.statusText.textContent = '已取消识图';
            return;
        }

        if (!state.loadedImageEl) {
            if (logger) logger.warn('触发转换失败: 尚未载入底图图片');
            showNotification('⚠️ 请先点击「上传底图」上传一张线路图图片或 PDF！');
            return;
        }

        // 核心底层方案：直接调用 DeepSeek 视觉大模型 (deepseek-v4-flash-vision-exp)
        if (!window.DeepSeekVision || !window.DeepSeekVision.hasApiKey()) {
            showNotification('🔔 识别线路图需配置 DeepSeek API Key（DeepSeek 官方按量扣费 · 本站完全免费）');
            if (window.DeepSeekVision) {
                window.DeepSeekVision.openSettingsModal();
            }
            return;
        }

        // 探测标题城市并预加载在线城市知识库
        let preloadedKnowledge = null;
        if (window.CityKnowledgeMatcher) {
            const detectedCity = window.CityKnowledgeMatcher.detectCityFromText(state.cityName || "");
            if (detectedCity) {
                state.cityName = detectedCity.name;
                preloadedKnowledge = await window.CityKnowledgeMatcher.loadCityStationsOnline(detectedCity.name);
            }
        }

        showNotification('🚀 正在调用 DeepSeek deepseek-v4-flash-vision-exp 视觉大模型深度识图... (DeepSeek 官方按量扣费 · 本站完全免费)');
        if (dom.statusText) {
            dom.statusText.textContent = '正在思考 (0s)';
        }

        if (btn) {
            btn.innerHTML = '<cgo-icon name="close" size="14"></cgo-icon><span>取消 (0s)</span>';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-dark');
        }

        try {
            const result = await window.DeepSeekVision.recognizeTransitMap(state.loadedImageEl, {
                onProgress: ({ phase, elapsedSeconds, statusText }) => {
                    if (dom.statusText) {
                        dom.statusText.textContent = statusText;
                    }
                    if (btn) {
                        btn.innerHTML = `<cgo-icon name="close" size="14"></cgo-icon><span>取消 (${elapsedSeconds}s)</span>`;
                    }
                }
            });
            await applyDeepSeekRecognitionResult(result.rawJson, result.usage, result.estCostRmb, preloadedKnowledge);
        } catch (err) {
            if (logger) logger.error('DeepSeek 视觉大模型识别失败:', err);
            showNotification(`⚠️ DeepSeek 识图失败: ${err.message}`);
            if (dom.statusText) {
                dom.statusText.textContent = '识图未完成，请重试';
            }
        } finally {
            if (btn) {
                btn.innerHTML = '<cgo-icon name="sparkle" size="14"></cgo-icon><span>视觉识图</span>';
                btn.classList.remove('btn-dark');
                btn.classList.add('btn-primary');
            }
        }
    }

    /**
     * 将 DeepSeek 视觉模型解析出的数据应用到 OpenMap 拓扑模型 (结合在线城市知识库智能对齐)
     */
    async function applyDeepSeekRecognitionResult(data, usage, estCostRmb, preloadedKnowledge) {
        const logger = window.DrunkLogger;
        if (!data) throw new Error('DeepSeek 返回的数据为空');

        // 1. 城市信息更新与在线知识库按需拉取
        if (data.city) state.cityName = data.city;
        if (data.cityId) state.cityId = data.cityId;

        let cityKnowledge = preloadedKnowledge;
        if (!cityKnowledge && window.CityKnowledgeMatcher) {
            const detected = window.CityKnowledgeMatcher.detectCityFromText(state.cityName || data.city || "");
            if (detected) {
                state.cityName = detected.name;
                cityKnowledge = await window.CityKnowledgeMatcher.loadCityStationsOnline(detected.name);
            }
        }

        // 2. 车站标准化处理与智能纠错对齐
        let rawStations = Array.isArray(data.stations) ? data.stations : [];
        const rawLines = Array.isArray(data.lines) ? data.lines : [];

        // 如果获取到了城市知识库，利用在线知识库进行站名模糊纠错与中英文权威补全
        if (cityKnowledge && window.CityKnowledgeMatcher) {
            rawStations = window.CityKnowledgeMatcher.matchAndAlignStations(rawStations, cityKnowledge);
        }

        // 统计所有线路上车站出现频次，用于精准判定换乘站
        const stationLineCount = {};
        rawLines.forEach(l => {
            const stList = Array.isArray(l.stations) ? l.stations : [];
            stList.forEach(name => {
                const cleanName = String(name).trim();
                stationLineCount[cleanName] = (stationLineCount[cleanName] || 0) + 1;
            });
        });

        const newStations = {};
        const stationNameToId = {};
        let staCounter = 1;

        // 优先处理已给出坐标的车站列表 (兼容 name 与 cn 字段，严禁使用硬编码词典篡改架空/原创站名)
        rawStations.forEach(st => {
            const staName = st.name || st.cn;
            if (!staName) return;
            const cleanName = String(staName).trim();
            const sid = `S_${String(staCounter).padStart(3, '0')}`;
            staCounter++;

            // 坐标归一化映射至画布像素尺寸 (兼容 0~1000 归一化值 与 原始像素坐标)
            let normX = typeof st.x === 'number' ? st.x : 500;
            let normY = typeof st.y === 'number' ? st.y : 500;
            if (normX > 1000 || normY > 1000) {
                const baseW = state.loadedImageEl ? (state.loadedImageEl.naturalWidth || state.loadedImageEl.width) : state.mapSize.width;
                const baseH = state.loadedImageEl ? (state.loadedImageEl.naturalHeight || state.loadedImageEl.height) : state.mapSize.height;
                normX = (normX / (baseW || 1)) * 1000;
                normY = (normY / (baseH || 1)) * 1000;
            }

            const sx = Math.max(30, Math.min(state.mapSize.width - 30, Math.round((normX / 1000) * state.mapSize.width)));
            const sy = Math.max(30, Math.min(state.mapSize.height - 30, Math.round((normY / 1000) * state.mapSize.height)));

            const isTsf = (st.isTransfer === true) || ((stationLineCount[cleanName] || 0) >= 2);

            newStations[sid] = {
                type: isTsf ? 'tsf' : 'dot',
                x: sx,
                y: sy,
                cn: cleanName,
                en: st.en || cleanName,
                align: st.align || 'top',
                offset: { x: 0, y: 0 }
            };

            stationNameToId[cleanName] = sid;
        });

        // 检查 lines 中引用的站名是否遗漏，如有遗漏则按拓扑补齐
        rawLines.forEach((l, lIdx) => {
            const stList = Array.isArray(l.stations) ? l.stations : [];
            stList.forEach((name, stIdx) => {
                const cleanName = String(name).trim();
                if (!stationNameToId[cleanName]) {
                    const sid = `S_${String(staCounter).padStart(3, '0')}`;
                    staCounter++;

                    // 估算坐标：沿线均分排布
                    const ratio = (stIdx + 1) / (stList.length + 1);
                    const sx = Math.round(state.mapSize.width * 0.15 + ratio * state.mapSize.width * 0.7);
                    const sy = Math.round(state.mapSize.height * 0.2 + (lIdx * 45) % (state.mapSize.height * 0.6));

                    const isTsf = (stationLineCount[cleanName] || 0) >= 2;

                    newStations[sid] = {
                        type: isTsf ? 'tsf' : 'dot',
                        x: sx,
                        y: sy,
                        cn: cleanName,
                        en: cleanName,
                        align: 'top',
                        offset: { x: 0, y: 0 }
                    };

                    stationNameToId[cleanName] = sid;
                }
            });
        });

        // 3. 线路标准化与拓扑计算
        const newLines = [];
        rawLines.forEach((line, lIdx) => {
            const stList = Array.isArray(line.stations) ? line.stations : [];
            const sIds = [];

            stList.forEach(name => {
                const cleanName = String(name).trim();
                const sid = stationNameToId[cleanName];
                if (sid && !sIds.includes(sid)) {
                    sIds.push(sid);
                }
            });

            if (sIds.length >= 2) {
                // 计算连续站间距，确保满足 distances.length === stationIds.length - 1
                const distances = [];
                for (let i = 0; i < sIds.length - 1; i++) {
                    const p1 = newStations[sIds[i]];
                    const p2 = newStations[sIds[i + 1]];
                    const d = Math.max(20, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y)));
                    distances.push(d);
                }

                // 提取数字编号用于 SVG 图标
                const numMatch = (line.name || '').match(/\d+/);
                const lineNum = numMatch ? parseInt(numMatch[0], 10) : (lIdx + 1);
                const svgName = `icon@${String(lineNum).padStart(2, '0')}.svg`;

                newLines.push({
                    id: line.id || `L${lIdx + 1}`,
                    name: line.name || `${lIdx + 1}号线`,
                    color: line.color || '#006098',
                    svg: svgName,
                    company: `${state.cityName}轨道交通`,
                    stationIds: sIds,
                    distances: distances
                });
            }
        });

        // 写入状态
        state.stations = newStations;
        state.lines = newLines;

        if (logger) {
            logger.banner('DeepSeek 视觉拓扑装载完成', `目标城市: ${state.cityName} (${state.cityId})`);
            logger.info(`识别到有效线路: ${newLines.length} 条 | 车站总数: ${Object.keys(newStations).length} 座`);
            logger.info(`Token 扣费: 输入 ${usage.prompt_tokens} + 输出 ${usage.completion_tokens} (预估 ¥${estCostRmb} 元，DeepSeek 官方按量收取，本站 100% 免费)`);
        }

        renderAll();
        validateAndReport();

        showNotification(`🎉 DeepSeek 识图成功！识别到 ${newLines.length} 条线路与 ${Object.keys(newStations).length} 座车站（DeepSeek 官方按量扣取约 ¥${estCostRmb} 元，本站完全免费）`);
    }

    /**
     * 渲染全部图层
     */
    function renderAll() {
        updateEmptyStateView();
        renderLines();
        renderStations();
        renderLabels();
        renderLegendList();
        validateAndReport();
        applyTransform();

        const logger = window.DrunkLogger;
        if (logger && Object.keys(state.stations).length > 0) {
            const staCount = Object.keys(state.stations).length;
            const tsfCount = Object.keys(state.stations).filter(k => state.stations[k].type === 'tsf').length;
            logger.group('画布图元渲染与视图同步 (Canvas Rendering)');
            logger.info(`SVG 矢量线路绘制: ${state.lines.length} 条折线 Path`);
            logger.info(`车站圆点图元渲染: ${staCount} 座 (普通站: ${staCount - tsfCount}, 核心换乘枢纽: ${tsfCount})`);
            logger.info(`8 方向文本标签渲染: ${staCount} 处 (自适应排版与避让锚点已就绪)`);
            logger.info(`图例管理抽屉同步: ${state.lines.length} 个官方线路徽章与图例项`);
            logger.groupEnd();
        }
    }

    /**
     * 绘制 SVG 矢量线路
     */
    function renderLines() {
        dom.svgLinesLayer.innerHTML = '';
        dom.svgLinesLayer.setAttribute('width', state.mapSize.width);
        dom.svgLinesLayer.setAttribute('height', state.mapSize.height);

        state.lines.forEach(line => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let d = '';

            const scaleX = state.mapSize.width / (line._srcCanvasW || state.mapSize.width);
            const scaleY = state.mapSize.height / (line._srcCanvasH || state.mapSize.height);

            if (line.svgPath) {
                // ★★★ 模式 1 (最高优先级): 100% 忠实还原 Illustrator/PDF 原生矢量走向与丝滑贝塞尔圆弧 ★★★
                if (Math.abs(scaleX - 1.0) < 0.002 && Math.abs(scaleY - 1.0) < 0.002) {
                    d = line.svgPath;
                } else {
                    // 自适应按画布尺寸微调缩放坐标
                    d = line.svgPath.replace(/([MLC])\s*([-\d\.]+)\s+([-\d\.]+)(?:\s+([-\d\.]+)\s+([-\d\.]+)\s+([-\d\.]+)\s+([-\d\.]+))?/g, (match, cmd, x1, y1, x2, y2, x3, y3) => {
                        if (cmd === 'M' || cmd === 'L') {
                            return `${cmd} ${Math.round(parseFloat(x1) * scaleX * 10) / 10} ${Math.round(parseFloat(y1) * scaleY * 10) / 10}`;
                        } else if (cmd === 'C') {
                            return `C ${Math.round(parseFloat(x1) * scaleX * 10) / 10} ${Math.round(parseFloat(y1) * scaleY * 10) / 10} ${Math.round(parseFloat(x2) * scaleX * 10) / 10} ${Math.round(parseFloat(y2) * scaleY * 10) / 10} ${Math.round(parseFloat(x3) * scaleX * 10) / 10} ${Math.round(parseFloat(y3) * scaleY * 10) / 10}`;
                        }
                        return match;
                    });
                }
            } else if (line.pathPoints && line.pathPoints.length >= 2) {
                // 模式 2: 主干离散路径点渲染
                line.pathPoints.forEach((pt, idx) => {
                    const x = Math.round(pt.x * scaleX);
                    const y = Math.round(pt.y * scaleY);
                    d += idx === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
                });
            } else if (line.stationIds && line.stationIds.length >= 2) {
                // 模式 3: 站点直连安全降级（仅当有明确排过序的站点，且相邻两站距离合理时连接）
                const MAX_SAFE_SPAN = state.mapSize.width * 0.35; // 超过 35% 宽度的超长跳跃不连，防止织网穿刺
                let hasMoved = false;

                for (let idx = 0; idx < line.stationIds.length; idx++) {
                    const sid = line.stationIds[idx];
                    const s = state.stations[sid];
                    if (!s) continue;

                    if (!hasMoved) {
                        d += `M ${s.x} ${s.y} `;
                        hasMoved = true;
                    } else {
                        const prevS = state.stations[line.stationIds[idx - 1]];
                        if (prevS && Math.hypot(s.x - prevS.x, s.y - prevS.y) <= MAX_SAFE_SPAN) {
                            d += `L ${s.x} ${s.y} `;
                        } else {
                            d += `M ${s.x} ${s.y} `;
                        }
                    }
                }
            } else {
                return; // 跳过无几何数据线路
            }

            if (!d.trim()) return;

            path.setAttribute('d', d.trim());
            path.setAttribute('stroke', line.color || '#006098');
            path.setAttribute('stroke-width', '8');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('opacity', '0.95');
            path.setAttribute('class', 'line-path-svg');
            path.setAttribute('data-line-id', line.id);

            dom.svgLinesLayer.appendChild(path);
        });
    }

    /**
     * 渲染站点圆点
     */
    function renderStations() {
        dom.stationsLayer.innerHTML = '';

        Object.keys(state.stations).forEach(id => {
            const s = state.stations[id];
            const dot = document.createElement('div');
            dot.className = `station-dot ${s.type === 'tsf' ? 'type-tsf' : 'type-dot'}`;
            dot.id = `dot-${id}`;
            dot.setAttribute('data-id', id);
            dot.style.left = `${s.x}px`;
            dot.style.top = `${s.y}px`;

            // 点击选中与拖拽监听
            dot.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                state.isDraggingStation = true;
                state.draggedStationId = id;
                selectStation(id);
            });

            dom.stationsLayer.appendChild(dot);
        });

        if (dom.stationCountBadge) {
            dom.stationCountBadge.textContent = `${Object.keys(state.stations).length} 车站`;
        }
    }

    /**
     * 渲染站名标签
     */
    function renderLabels() {
        dom.labelsLayer.innerHTML = '';

        Object.keys(state.stations).forEach(id => {
            const s = state.stations[id];
            const label = document.createElement('div');
            label.className = `station-label align-${s.align || 'top'}`;
            label.id = `label-${id}`;
            label.setAttribute('data-id', id);

            const cnSpan = document.createElement('div');
            cnSpan.className = 'sta-cn';
            cnSpan.textContent = s.cn;

            const enSpan = document.createElement('div');
            enSpan.className = 'sta-en';
            enSpan.textContent = s.en;

            label.appendChild(cnSpan);
            label.appendChild(enSpan);

            updateSingleLabelStyle(label, s);

            label.addEventListener('click', (e) => {
                e.stopPropagation();
                selectStation(id);
            });

            dom.labelsLayer.appendChild(label);
        });
    }

    function updateSingleLabelStyle(labelEl, station) {
        labelEl.style.left = `${station.x}px`;
        labelEl.style.top = `${station.y}px`;
        labelEl.className = `station-label align-${station.align || 'top'}`;
    }

    function updateStationElementPos(id) {
        const dot = document.getElementById(`dot-${id}`);
        const s = state.stations[id];
        if (dot && s) {
            dot.style.left = `${s.x}px`;
            dot.style.top = `${s.y}px`;
        }
    }

    function updateLabelElementPos(id) {
        const label = document.getElementById(`label-${id}`);
        const s = state.stations[id];
        if (label && s) {
            updateSingleLabelStyle(label, s);
        }
    }

    /**
     * 选中车站并激活属性检视面板
     */
    function selectStation(id) {
        state.selectedStationId = id;
        const s = state.stations[id];
        if (!s) return;

        document.querySelectorAll('.station-dot.selected').forEach(el => el.classList.remove('selected'));
        const dot = document.getElementById(`dot-${id}`);
        if (dot) dot.classList.add('selected');

        if (dom.inspectorStationName) dom.inspectorStationName.textContent = s.cn;
        if (dom.inspectorStationEn) dom.inspectorStationEn.textContent = s.en;
        if (dom.inspectorStationId) dom.inspectorStationId.textContent = id;
        if (dom.inspectorAlignDisplay) dom.inspectorAlignDisplay.textContent = s.align || 'top';

        highlightActiveAlignWheel(s.align || 'top');
    }

    function highlightActiveAlignWheel(align) {
        if (!dom.alignWheel) return;
        dom.alignWheel.querySelectorAll('.wheel-sector').forEach(btn => {
            if (btn.getAttribute('data-align') === align) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * 渲染图例列表
     */
    function renderLegendList() {
        if (!dom.legendListContainer) return;
        dom.legendListContainer.innerHTML = '';

        state.lines.forEach(line => {
            const item = document.createElement('div');
            item.className = 'legend-item-card';

            const colorBadge = document.createElement('span');
            colorBadge.className = 'legend-color-pill';
            colorBadge.style.backgroundColor = line.color || "#006098";

            const nameSpan = document.createElement('span');
            nameSpan.className = 'legend-name-text';
            nameSpan.textContent = line.name;

            const countSpan = document.createElement('span');
            countSpan.className = 'legend-sta-count';
            countSpan.textContent = `${line.stationIds.length} 站`;

            item.appendChild(colorBadge);
            item.appendChild(nameSpan);
            item.appendChild(countSpan);

            item.addEventListener('click', () => {
                highlightLine(line.id);
            });

            dom.legendListContainer.appendChild(item);
        });

        if (dom.lineCountBadge) {
            dom.lineCountBadge.textContent = `${state.lines.length} 条线路`;
        }
    }

    function highlightLine(lineId) {
        document.querySelectorAll('.line-path-svg').forEach(p => {
            if (p.getAttribute('data-line-id') === lineId) {
                p.classList.add('highlighted');
                p.setAttribute('stroke-width', '12');
            } else {
                p.classList.remove('highlighted');
                p.setAttribute('stroke-width', '8');
            }
        });
    }

    /**
     * 一键 45°/90° 正交网格吸附
     */
    function snapGrid() {
        if (Object.keys(state.stations).length === 0) return;
        const logger = window.DrunkLogger;
        if (logger) {
            logger.info(`📐 [正交吸附] 对 ${Object.keys(state.stations).length} 座车站执行 45°/90° 正交网格吸附 (网格间距: 10px)`);
        }
        state.stations = window.DrunkTopology.snapToOrthogonalGrid(state.stations, 10);
        renderAll();
        showNotification("📐 已成功执行 45°/90° 正交网格吸附对齐！线条更加规整专业。");
    }

    /**
     * 数据完整性体检
     */
    function validateAndReport() {
        const logger = window.DrunkLogger;
        if (Object.keys(state.stations).length === 0) {
            if (dom.statusIndicator) dom.statusIndicator.className = 'badge badge-info';
            if (dom.statusText) dom.statusText.textContent = "等待上传底图";
            return;
        }

        const report = window.DrunkCodeGen.validateData(state.stations, state.lines);
        if (logger) {
            logger.group('OpenMap 铁律自检与数据完整性诊断 (Data Health Diagnostics)');
            if (report.isValid) {
                logger.success('✅ 核心铁律自检全部通过：站间距与站点数严格对应，所有 stationId 存在，无孤立断网！');
            } else {
                logger.error(`❌ 数据完整性校验发现 ${report.errors.length} 项异常：`);
                report.errors.forEach((err, idx) => logger.error(`  ${idx + 1}. ${err}`));
            }
            if (report.warnings && report.warnings.length > 0) {
                logger.warn(`⚠️ 存在 ${report.warnings.length} 项提示与轻微警告：`);
                report.warnings.forEach((w, idx) => logger.warn(`  ${idx + 1}. ${w}`));
            }
            logger.groupEnd();
        }

        if (dom.statusIndicator) {
            if (report.isValid) {
                dom.statusIndicator.className = 'badge badge-success';
                dom.statusText.textContent = "数据完整性通过 (100% 合规)";
            } else {
                dom.statusIndicator.className = 'badge badge-danger';
                dom.statusText.textContent = `发现 ${report.errors.length} 项异常`;
            }
        }
    }

    /**
     * 导出 OpenMap 城市工程包
     */
    function exportCityFiles() {
        if (Object.keys(state.stations).length === 0) {
            showNotification("⚠️ 暂无任何站点数据，请先上传并转换线路图！");
            return;
        }

        const stationsJs = window.DrunkCodeGen.generateStationsJs(state.cityId, state.cityName, state.stations);
        const linesJs = window.DrunkCodeGen.generateLinesJs(state.cityId, state.cityName, state.lines);
        const legendJs = window.DrunkCodeGen.generateLegendJs(state.cityId, state.cityName, state.lines);
        const mainJs = window.DrunkCodeGen.generateCityMainJs(state.cityId, state.cityName, state.lines);

        const modal = document.getElementById('export-modal');
        const textarea = document.getElementById('export-code-preview');
        if (modal && textarea) {
            textarea.value = `// ================== 1. data_stations.js ==================\n${stationsJs}\n\n// ================== 2. data_lines.js ==================\n${linesJs}\n\n// ================== 3. data_legend.js ==================\n${legendJs}\n\n// ================== 4. ${state.cityId}.js ==================\n${mainJs}`;
            modal.classList.add('active');
        }

        const logger = window.DrunkLogger;
        if (logger) {
            logger.info(`📦 [代码导出] 已生成 OpenMap 标准城市工程包 (涵盖 data_stations.js, data_lines.js, data_legend.js, ${state.cityId}.js)`);
        }
    }

    function showNotification(msg) {
        const banner = document.getElementById('notification-toast');
        if (banner) {
            banner.textContent = msg;
            banner.classList.add('show');
            setTimeout(() => banner.classList.remove('show'), 3800);
        }
    }

    return {
        init,
        runAutoConvert,
        snapGrid,
        exportCityFiles,
        showNotification
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.DrunkPipeline.init();
});
