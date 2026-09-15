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
        // 线路编辑：选中的线路下标，以及选中/正在拖动的走向折点
        selectedLineIdx: -1,
        selectedVertex: null,        // { lineIdx, groupKey, ptIdx }
        isDraggingVertex: false,
        ghostOpacity: 0.45,
        currentImageSrc: null,
        loadedImageEl: null,
        detectedCityInfo: null,

        // ── 编辑模式 (Edit Mode) ────────────────────────────────────────────
        // mode = "convert"：从底图/PDF 识别出一座新城市（Drunk 的原始用途）
        // mode = "edit"   ：把 city/{id}/ 下**已有城市**读进来微调（OpenMap 的编辑模式）
        mode: 'convert',
        project: null,          // CityProjectIO 读回的城市工程（含 data_*.js 源码原文）
        cityIconRenderer: null, // 城市自定义车站图元画法 city.renderStationIcon（如上海短横/胶囊）
        originals: null,        // 进入编辑模式时的深拷贝快照，用于脏标记比对
        history: [],            // 撤销栈（快照式，上限 HISTORY_LIMIT）

        // 核心地图模型
        stations: {},
        lines: []
    };

    /** 撤销栈深度。站点数最多千余，整份快照也就几百 KB，足够廉价。 */
    const HISTORY_LIMIT = 60;

    let dom = {};

    function init() {
        cacheDom();
        bindEvents();
        populateCityPicker();
        updateModeView();
        updateEmptyStateView();

        // 支持从线路图直达编辑模式：drunk/index.html?city=sydney
        const cityParam = new URLSearchParams(window.location.search).get('city');
        if (cityParam) {
            if (dom.citySelect) dom.citySelect.value = cityParam;
            loadExistingCity(cityParam);
        }
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

        // 编辑模式相关
        dom.citySelect = document.getElementById('edit-city-select');
        dom.btnLoadCity = document.getElementById('btn-load-city');
        dom.modeBadge = document.getElementById('drunk-mode-badge');
        dom.dirtyBadge = document.getElementById('dirty-count-badge');
        dom.editFields = document.getElementById('inspector-edit-fields');
        dom.fieldCn = document.getElementById('field-sta-cn');
        dom.fieldEn = document.getElementById('field-sta-en');
        dom.fieldType = document.getElementById('field-sta-type');
        dom.fieldOffsetX = document.getElementById('field-sta-offset-x');
        dom.fieldOffsetY = document.getElementById('field-sta-offset-y');
        dom.ghostControls = document.getElementById('ghost-controls');

        // 线路编辑
        dom.verticesLayer = document.getElementById('drunk-vertices-layer');
        dom.lineCard = document.getElementById('line-inspector-card');
        dom.lineMeta = document.getElementById('line-inspector-meta');
        dom.fieldLineName = document.getElementById('field-line-name');
        dom.fieldLineColor = document.getElementById('field-line-color');
        dom.fieldLineColorHex = document.getElementById('field-line-color-hex');
        dom.fieldLineCompany = document.getElementById('field-line-company');
        dom.fieldStrictRounding = document.getElementById('field-line-strict-rounding');
        dom.fieldPointOnly = document.getElementById('field-line-point-only');

        // 折点圆角
        dom.cornerBox = document.getElementById('corner-radius-box');
        dom.cornerTitle = document.getElementById('corner-radius-title');
        dom.cornerSlider = document.getElementById('corner-radius-slider');
        dom.fieldCornerRadius = document.getElementById('field-corner-radius');
        dom.cornerHint = document.getElementById('corner-radius-hint');
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
            if (e.target.closest('.station-dot') || e.target.closest('.station-label')
                || e.target.closest('.path-vertex') || e.target.closest('.line-path-svg')
                || e.target.closest('#drunk-empty-guide')) return;
            state.isDraggingMap = true;
            state.dragStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
            dom.viewport.style.cursor = 'grabbing';
        });

        // 双击线条：在最近的那段上插入一个走向折点
        dom.viewport.addEventListener('dblclick', (e) => {
            const path = e.target.closest('.line-path-svg');
            if (!path) return;
            e.preventDefault();
            const idx = parseInt(path.getAttribute('data-line-idx'), 10);
            if (Number.isNaN(idx)) return;
            const rect = dom.mapCanvasContainer.getBoundingClientRect();
            if (state.selectedLineIdx !== idx) selectLine(idx);
            insertVertexAt(idx, (e.clientX - rect.left) / state.scale, (e.clientY - rect.top) / state.scale);
        });

        window.addEventListener('mousemove', (e) => {
            if (state.isDraggingMap) {
                state.pan.x = e.clientX - state.dragStart.x;
                state.pan.y = e.clientY - state.dragStart.y;
                applyTransform();
            } else if (state.isDraggingVertex && state.selectedVertex) {
                // 拖拽走向折点
                const sel = state.selectedVertex;
                const line = state.lines[sel.lineIdx];
                const points = line && line[sel.groupKey];
                if (Array.isArray(points) && points[sel.ptIdx]) {
                    const rect = dom.mapCanvasContainer.getBoundingClientRect();
                    points[sel.ptIdx].x = round2((e.clientX - rect.left) / state.scale);
                    points[sel.ptIdx].y = round2((e.clientY - rect.top) / state.scale);
                    renderLines();
                }
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
                updateDirtyBadge();
            }
            if (state.isDraggingVertex) {
                state.isDraggingVertex = false;
                updateDirtyBadge();
            }
        });

        // 滚轮 / 触控板（逻辑与 core/script.js 主引擎保持一致，见 handleWheel 注释）
        dom.viewport.addEventListener('wheel', handleWheel, { passive: false });

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
                        pushHistory();
                        s.align = newAlign;
                        updateLabelElementPos(state.selectedStationId);
                        highlightActiveAlignWheel(newAlign);
                        updateDirtyBadge();
                    }
                }
            });
        }

        // ── 编辑模式：城市选择与载入 ──────────────────────────────────────────
        if (dom.btnLoadCity) {
            dom.btnLoadCity.addEventListener('click', () => {
                loadExistingCity(dom.citySelect ? dom.citySelect.value : '');
            });
        }
        if (dom.citySelect) {
            dom.citySelect.addEventListener('change', () => {
                if (dom.citySelect.value) loadExistingCity(dom.citySelect.value);
            });
        }

        // ── 编辑模式：站名与偏移字段 ──────────────────────────────────────────
        bindStationField(dom.fieldCn, 'cn');
        bindStationField(dom.fieldEn, 'en');
        bindStationField(dom.fieldType, 'type');
        bindOffsetField(dom.fieldOffsetX, 'x');
        bindOffsetField(dom.fieldOffsetY, 'y');

        // ── 线路属性字段 ──────────────────────────────────────────────────────
        bindLineField(dom.fieldLineName, 'name');
        bindLineField(dom.fieldLineCompany, 'company');
        // 取色器与 hex 输入框双向同步：取色器给 #RRGGBB，
        // 手填框允许保留城市原有写法（如沈阳的 "rgb(207, 53, 23)"）
        bindLineField(dom.fieldLineColor, 'color');
        bindLineField(dom.fieldLineColorHex, 'color');

        // 整条线的倒角收紧开关（engine: limitFactor 0.9 → 0.5）
        if (dom.fieldStrictRounding) {
            dom.fieldStrictRounding.addEventListener('change', () => {
                const line = state.lines[state.selectedLineIdx];
                if (!line) return;
                pushHistory();
                if (dom.fieldStrictRounding.checked) line.useStrictRounding = true;
                else delete line.useStrictRounding;
                renderLines();
                updateDirtyBadge();
            });
        }

        // 仅落站点、不画走向（国铁等）
        if (dom.fieldPointOnly) {
            dom.fieldPointOnly.addEventListener('change', () => {
                const line = state.lines[state.selectedLineIdx];
                if (!line) return;
                pushHistory();
                if (dom.fieldPointOnly.checked) line.isPointOnly = true;
                else delete line.isPointOnly;
                renderAll();
                selectLine(state.selectedLineIdx);
                updateDirtyBadge();
            });
        }

        // ── 折点圆角半径 ──────────────────────────────────────────────────────
        if (dom.cornerSlider) {
            dom.cornerSlider.addEventListener('input', () => setCornerRadius(dom.cornerSlider.value));
        }
        if (dom.fieldCornerRadius) {
            dom.fieldCornerRadius.addEventListener('change', () => {
                const v = dom.fieldCornerRadius.value.trim();
                setCornerRadius(v === '' ? null : v);
            });
        }
        document.querySelectorAll('[data-corner-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.getAttribute('data-corner-preset');
                setCornerRadius(preset === 'auto' ? null : Number(preset));
            });
        });

        // ── 键盘快捷键 ────────────────────────────────────────────────────────
        window.addEventListener('keydown', handleShortcut);
    }

    /** 判断焦点是否落在输入控件里（此时不应劫持方向键/Delete） */
    function isTypingTarget(el) {
        if (!el) return false;
        const tag = (el.tagName || '').toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    }

    function handleShortcut(e) {
        const mod = e.metaKey || e.ctrlKey;
        if (mod && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            undo();
            return;
        }
        if (mod && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            exportCityFiles();
            return;
        }
        if (isTypingTarget(e.target)) return;

        const ARROWS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

        // 走向折点优先响应：选中折点时方向键微调折点、Delete 删折点
        if (state.selectedVertex) {
            const sel = state.selectedVertex;
            const line = state.lines[sel.lineIdx];
            const pt = line && Array.isArray(line[sel.groupKey]) ? line[sel.groupKey][sel.ptIdx] : null;
            if (pt && ARROWS[e.key]) {
                e.preventDefault();
                const [dx, dy] = ARROWS[e.key];
                const step = e.shiftKey ? 10 : 1;
                pushHistory();
                pt.x = round2(pt.x + dx * step);
                pt.y = round2(pt.y + dy * step);
                renderLines();
                updateDirtyBadge();
                return;
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                if (deleteSelectedVertex()) return;
            }
            if (e.key === 'Escape') { state.selectedVertex = null; renderVertices(); return; }
        }

        if (e.key === 'Escape' && state.selectedLineIdx >= 0) { deselectLine(); return; }
        if (!state.selectedStationId) return;

        const s = state.stations[state.selectedStationId];
        if (!s) return;

        if (ARROWS[e.key]) {
            e.preventDefault();
            const [dx, dy] = ARROWS[e.key];
            const step = e.shiftKey ? 10 : 1;
            pushHistory();
            if (e.altKey) {
                // Alt + 方向键微调「文字相对站点的偏移」，站点本身不动
                s.offset = s.offset || { x: 0, y: 0 };
                s.offset.x = round2(s.offset.x + dx * step);
                s.offset.y = round2(s.offset.y + dy * step);
                syncInspectorFields(s);
            } else {
                s.x = round2(s.x + dx * step);
                s.y = round2(s.y + dy * step);
                updateStationElementPos(state.selectedStationId);
                renderLines();
            }
            updateLabelElementPos(state.selectedStationId);
            updateDirtyBadge();
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            deleteSelectedStation();
        }
    }

    function round2(n) {
        return Math.round(n * 100) / 100;
    }

    /** 把检视面板的文本框与选中站点的某个字段双向绑定 */
    function bindStationField(el, key) {
        if (!el) return;
        el.addEventListener('change', () => {
            const s = state.stations[state.selectedStationId];
            if (!s) return;
            const value = el.value;
            if (key === 'cn' && !value.trim()) {
                el.value = s.cn || '';
                showNotification('中文站名不能为空。');
                return;
            }
            if (String(s[key] == null ? '' : s[key]) === value) return;
            pushHistory();
            s[key] = value;
            renderLabels();
            renderStations();
            selectStation(state.selectedStationId);
            updateDirtyBadge();
        });
    }

    function bindOffsetField(el, axis) {
        if (!el) return;
        el.addEventListener('change', () => {
            const s = state.stations[state.selectedStationId];
            if (!s) return;
            const n = parseFloat(el.value);
            if (!Number.isFinite(n)) { syncInspectorFields(s); return; }
            s.offset = s.offset || { x: 0, y: 0 };
            if (s.offset[axis] === n) return;
            pushHistory();
            s.offset[axis] = n;
            updateLabelElementPos(state.selectedStationId);
            updateDirtyBadge();
        });
    }

    function deleteSelectedStation() {
        const id = state.selectedStationId;
        const s = state.stations[id];
        if (!s) return;
        const refLines = state.lines.filter(l => allStationIds(l).includes(id));
        const tip = refLines.length
            ? `「${s.cn}」被 ${refLines.length} 条线路引用，删除后将同步从线路走向与站间距中移除。确定删除？`
            : `确定删除孤立站点「${s.cn}」？`;
        if (!window.confirm(tip)) return;

        pushHistory();
        delete state.stations[id];
        // 从各线路（含分支）的站序中摘除，并把被摘除站两侧的站间距合并为一段
        state.lines.forEach(line => {
            stationGroups(line).forEach(g => {
                let idx;
                // 同一条线上同名 ID 可能出现多次（环线首尾），逐个摘除
                while ((idx = g.ids.indexOf(id)) >= 0) {
                    g.ids.splice(idx, 1);
                    const dist = line[g.distKey];
                    if (!Array.isArray(dist) || !dist.length) continue;
                    if (idx > 0 && idx < dist.length) {
                        const a = dist[idx - 1];
                        const b = dist[idx];
                        // 站间距可能是 "约21千" 这类人工标注文本，无法相加时保留前一段并标注待核
                        dist[idx - 1] = (typeof a === 'number' && typeof b === 'number')
                            ? a + b
                            : `${a} + ${b} 待核`;
                        dist.splice(idx, 1);
                    } else if (idx === 0) {
                        dist.splice(0, 1);
                    } else {
                        dist.pop();
                    }
                }
            });
        });
        state.selectedStationId = null;
        renderAll();
        updateDirtyBadge();
        showNotification(`已删除「${s.cn}」，可按 Ctrl/Cmd+Z 撤销。`);
    }

    // ==========================================================================
    // 编辑模式 (Edit Mode)：把 city/{id}/ 下的已有城市读进来当作可视化编辑对象
    // ==========================================================================

    /**
     * 填充顶栏的「编辑已有城市」下拉框。
     * 城市列表直接来自 city/data.js 的 CITY_REGISTRY，新城市注册后自动出现，
     * Drunk 侧无需任何硬编码（遵循「核心引擎与城市业务数据解耦」铁律）。
     */
    function populateCityPicker() {
        if (!window.CityProjectIO) return;
        const cities = window.CityProjectIO.listCities();
        const options = cities.map(c => `<option value="${c.id}">${c.name || c.id}</option>`).join('');

        if (dom.citySelect) {
            dom.citySelect.innerHTML = '<option value="">选择要编辑的城市…</option>' + options;
        }
        // 空状态引导里的同款下拉框
        const emptySelect = document.getElementById('edit-city-select-empty');
        if (emptySelect) {
            emptySelect.innerHTML = '<option value="">或编辑一座已注册的城市…</option>' + options;
        }
        if (dom.btnLoadCity) dom.btnLoadCity.disabled = cities.length === 0;

        const logger = window.DrunkLogger;
        if (logger && cities.length) {
            logger.info(`编辑模式可用城市: ${cities.map(c => `${c.name}(${c.id})`).join('、')}`);
        }
    }

    /**
     * 载入一座已注册城市，进入编辑模式。
     * 注意：station 对象**整份保留**（含 marker / labelSize / textScale 等
     * Drunk 本身不认识的字段），Drunk 只读写自己关心的那几个键。
     */
    async function loadExistingCity(cityId) {
        const logger = window.DrunkLogger;
        if (!cityId) {
            showNotification('请先在下拉框中选择一座已注册的城市。');
            return;
        }
        if (!window.CityProjectIO) {
            showNotification('城市工程读写层未加载，无法进入编辑模式。');
            return;
        }

        if (dom.statusText) dom.statusText.textContent = `正在载入 ${cityId}…`;

        let project;
        try {
            project = await window.CityProjectIO.loadCity(cityId);
        } catch (err) {
            if (logger) logger.error('城市工程载入失败:', err);
            showNotification(`载入失败：${err.message}`);
            if (dom.statusText) dom.statusText.textContent = '城市载入失败';
            return;
        }

        const stationsData = project.data.stationsData || {};
        const linesData = project.data.linesData || [];

        state.mode = 'edit';
        state.project = project;
        state.cityId = project.id;
        state.cityName = project.name;

        const meta = project.meta || {};
        state.mapSize = {
            width: (meta.mapSize && meta.mapSize.width) || 2000,
            height: (meta.mapSize && meta.mapSize.height) || 2000
        };

        // 编辑已有城市时没有底图可参照，画布即真值
        state.currentImageSrc = null;
        state.loadedImageEl = null;
        if (dom.ghostImage) { dom.ghostImage.src = ''; dom.ghostImage.style.display = 'none'; }
        if (dom.ghostControls) dom.ghostControls.style.display = 'none';

        state.stations = JSON.parse(JSON.stringify(stationsData));
        state.lines = JSON.parse(JSON.stringify(linesData));
        state.originals = {
            stations: JSON.parse(JSON.stringify(stationsData)),
            lines: JSON.parse(JSON.stringify(linesData))
        };
        state.history = [];
        clearSelection();

        // 统计每座车站经停线路的标志色——普通站的环色取第一条线的颜色，
        // 不算这一步画布上所有站点都会是白的，与线路图完全不像
        refreshLineColors();

        // 尝试接入该城市自定义的车站图元画法（上海短横与换乘胶囊、悉尼 Interchange 底衬）
        state.cityIconRenderer = null;
        await loadCityIconRenderer(project);

        dom.mapCanvasContainer.style.width = `${state.mapSize.width}px`;
        dom.mapCanvasContainer.style.height = `${state.mapSize.height}px`;
        fitToViewport();

        updateModeView();
        renderAll();

        if (logger) {
            logger.banner('OpenMap 城市工程编辑模式', `${project.name} (${project.id})`);
            logger.info(`画布尺寸: ${state.mapSize.width} × ${state.mapSize.height}`);
            logger.info(`载入车站 ${Object.keys(state.stations).length} 座 / 线路 ${state.lines.length} 条`);
            logger.info(`已缓存源码原文: ${Object.keys(project.sources).join(', ')}`);
            if (project.missing.length) logger.warn(`缺失或未解析的可选文件: ${project.missing.join(', ')}`);
            logger.info('导出时将只改写你实际改动过的条目，其余条目逐字节保持原样。');
        }

        showNotification(`已进入「${project.name}」编辑模式：${Object.keys(state.stations).length} 座车站可直接拖拽与改字。`);
    }

    /** 重算每座车站的 lineColors（线路增删改色后都要跑一次） */
    function refreshLineColors() {
        if (!window.CGoStationIcons) return;
        // 存成下划线私有字段：不写回文件，也不参与「改动过没有」的判定
        window.CGoStationIcons.computeLineColors(state.stations, state.lines, allStationIds, '_lineColors');
    }

    /**
     * 载入城市自定义的车站图元画法 `city.renderStationIcon`。
     *
     * ⚠️ 不能无脑注入城市主脚本：北京 / 合肥 / 青岛的 {city}.js 用 `document.write`
     * 同步加载专属模块，在 DOMContentLoaded 之后再注入会**直接冲掉整个文档**。
     * 因此先把源码取回来检查，含 document.write 的一律跳过——这几座城市本来
     * 也没实现 renderStationIcon，跳过不损失任何东西。
     */
    async function loadCityIconRenderer(project) {
        const logger = window.DrunkLogger;
        const url = `${project.base}/${project.id}.js`;
        let src;
        try {
            const res = await fetch(`${url}?_drunk=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            src = await res.text();
        } catch (err) { return; }

        if (/document\s*\.\s*write/.test(src)) {
            if (logger) logger.info(`${project.id}.js 使用 document.write 同步加载专属模块，已跳过自定义图元接入（该城市未实现 renderStationIcon）。`);
            return;
        }
        if (!/renderStationIcon/.test(src)) return;

        // 城市样式表里带着图元尺寸（如上海 .sh-marker），路径是站点根相对，
        // 从 /drunk/ 下会 404，这里按 Drunk 的相对位置补挂一次
        ensureCityStylesheet(project);

        try {
            // eslint-disable-next-line no-new-func
            new Function(src)();
        } catch (err) {
            if (logger) logger.warn(`${project.id}.js 执行失败，已跳过自定义图元：${err.message}`);
            return;
        }

        const city = window.CityDataManager && window.CityDataManager.getAllCities
            ? window.CityDataManager.getAllCities().find(c => c.id === project.id)
            : null;
        const fn = city && typeof city.renderStationIcon === 'function'
            ? city.renderStationIcon.bind(city)
            : null;

        if (fn) {
            state.cityIconRenderer = fn;
            if (logger) logger.success(`已接入 ${project.name} 的自定义车站图元画法 renderStationIcon。`);
        }
    }

    /** 给城市专属样式表补一个从 /drunk/ 出发的正确相对路径 */
    function ensureCityStylesheet(project) {
        const href = `${project.base}/style.css`;
        if (document.querySelector(`link[data-drunk-city-style="${project.id}"]`)) return;
        document.querySelectorAll('link[data-drunk-city-style]').forEach(el => el.remove());
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${href}?_drunk=${Date.now()}`;
        link.setAttribute('data-drunk-city-style', project.id);
        link.onerror = () => link.remove();   // 城市没有专属样式表是正常的
        document.head.appendChild(link);
    }

    /** 顶栏与侧栏按当前模式切换文案 */
    function updateModeView() {
        const editing = state.mode === 'edit';
        if (dom.modeBadge) {
            dom.modeBadge.textContent = editing ? `编辑模式 · ${state.cityName}` : '识图模式';
            dom.modeBadge.className = editing ? 'badge badge-success' : 'badge badge-info';
        }
        if (dom.editFields) dom.editFields.style.display = 'block';
        const exportBtn = document.getElementById('btn-export-openmap-bundle');
        if (exportBtn) {
            const label = exportBtn.querySelector('span');
            if (label) label.textContent = editing ? '导出改动文件' : '导出城市工程';
        }
        updateDirtyBadge();
    }

    // ---- 脏标记：只有真正变了的条目才会被写回 --------------------------------

    /**
     * 比对用的稳定序列化：丢掉以 `_` 开头的运行期私有字段。
     *
     * `_lineColors`（由线路颜色推导）、`_srcCanvasW/H`（PDF 直通的原画布尺寸）
     * 这类字段是算出来的、不写回文件的，若算进脏判定，一载入城市就会显示
     * 「477 处改动」，导出摘要也会把每座车站都列成改过。
     * 导出侧的 formatEntryValue / diffContainerEdits 早已同样过滤 `_` 前缀。
     */
    function stableJson(value) {
        return JSON.stringify(value, (k, v) => (k.startsWith('_') ? undefined : v));
    }

    function diffStations() {
        if (!state.originals) return [];
        const out = [];
        Object.keys(state.stations).forEach(id => {
            const before = state.originals.stations[id];
            if (!before) { out.push(id); return; }
            if (stableJson(state.stations[id]) !== stableJson(before)) out.push(id);
        });
        return out;
    }

    function diffLines() {
        if (!state.originals) return [];
        const out = [];
        state.lines.forEach((line, idx) => {
            const before = state.originals.lines[idx];
            if (!before) { out.push(idx); return; }
            if (stableJson(line) !== stableJson(before)) out.push(idx);
        });
        return out;
    }

    function removedStationIds() {
        if (!state.originals) return [];
        return Object.keys(state.originals.stations).filter(id => !state.stations[id]);
    }

    function updateDirtyBadge() {
        if (!dom.dirtyBadge) return;
        if (state.mode !== 'edit') { dom.dirtyBadge.style.display = 'none'; return; }
        const n = diffStations().length + diffLines().length + removedStationIds().length;
        dom.dirtyBadge.style.display = '';
        dom.dirtyBadge.textContent = n === 0 ? '未改动' : `${n} 处改动`;
        dom.dirtyBadge.className = n === 0 ? 'badge badge-info' : 'badge badge-warning';
    }

    // ---- 撤销栈 --------------------------------------------------------------

    function pushHistory() {
        const snap = JSON.stringify({ stations: state.stations, lines: state.lines });
        // 去重：站点 mousedown 会无条件压栈，但「点一下没拖动」并不产生改动，
        // 若照压不误，用户后续按 Ctrl+Z 会先撞上一串什么都没做的空撤销。
        if (state.history.length && state.history[state.history.length - 1] === snap) return;
        state.history.push(snap);
        if (state.history.length > HISTORY_LIMIT) state.history.shift();
    }

    function undo() {
        if (!state.history.length) {
            showNotification('没有可撤销的操作了。');
            return;
        }
        const snap = JSON.parse(state.history.pop());
        state.stations = snap.stations;
        state.lines = snap.lines;
        // 撤销可能把被选中的对象一并撤没了，越界的选中下标必须清掉
        if (state.selectedStationId && !state.stations[state.selectedStationId]) {
            state.selectedStationId = null;
        }
        if (state.selectedLineIdx >= state.lines.length) clearSelection();
        const sv = state.selectedVertex;
        if (sv && !(state.lines[sv.lineIdx]
            && Array.isArray(state.lines[sv.lineIdx][sv.groupKey])
            && state.lines[sv.lineIdx][sv.groupKey][sv.ptIdx])) {
            state.selectedVertex = null;
        }
        renderAll();
        if (state.selectedStationId) selectStation(state.selectedStationId);
        showNotification(`已撤销（还可撤销 ${state.history.length} 步）`);
    }

    function applyTransform() {
        dom.mapCanvasContainer.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.scale})`;
    }

    // ==========================================================================
    // 视口缩放与漫游（滚轮 / 触控板）
    // ==========================================================================

    const MIN_SCALE = 0.15;
    const MAX_SCALE = 3.5;

    /** 以视口内某一屏幕点为锚缩放，锚点下的图面内容保持不动 */
    function zoomToPoint(targetScale, clientX, clientY) {
        const next = Math.min(Math.max(targetScale, MIN_SCALE), MAX_SCALE);
        if (next === state.scale) return;
        const rect = dom.viewport.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        state.pan.x = mx - (mx - state.pan.x) * (next / state.scale);
        state.pan.y = my - (my - state.pan.y) * (next / state.scale);
        state.scale = next;
        applyTransform();
    }

    function panBy(dx, dy) {
        state.pan.x += dx;
        state.pan.y += dy;
        applyTransform();
    }

    /** 以视口中心为锚按倍率缩放（供 HUD 的 +/- 按钮调用） */
    function zoomBy(factor) {
        const rect = dom.viewport.getBoundingClientRect();
        zoomToPoint(state.scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    /** 把整幅画布缩放平移到刚好铺满视口并居中 */
    function fitToViewport() {
        if (!dom.viewport || !state.mapSize.width || !state.mapSize.height) return;
        const fit = Math.min(
            (dom.viewport.clientWidth - 80) / state.mapSize.width,
            (dom.viewport.clientHeight - 80) / state.mapSize.height
        );
        state.scale = Math.max(MIN_SCALE, Math.min(fit, 1.5));
        state.pan = {
            x: (dom.viewport.clientWidth - state.mapSize.width * state.scale) / 2,
            y: (dom.viewport.clientHeight - state.mapSize.height * state.scale) / 2
        };
        applyTransform();
    }

    /**
     * 滚轮 / 触控板处理。
     *
     * 原实现是「每收到一个 wheel 事件就 ×1.1 或 ×0.9」，与 deltaY 的实际大小无关。
     * 鼠标滚轮一格一个事件时还凑合，但 macOS 触控板两指滑动一次手势会连发几十个
     * 小 delta 事件，于是缩放按 1.1^n 指数级窜出去——这就是「太快了」的由来。
     *
     * 现在的规则：
     * - 缩放量与 deltaY 成正比，手势多长就缩多少；
     * - ctrlKey（macOS 触控板捏合、Windows Ctrl+滚轮）恒为缩放；
     * - 其余情况尊重用户在主图「偏好设置 → 滚轮与触控板」里的选择，
     *   复用同一个 localStorage 键 `nal_pref_wheel_mode`，两边设置一处生效；
     * - smart 模式下识别触控板：触控板两指滑动走平移，鼠标滚轮走缩放
     *   （识别规则与 core/script.js 完全一致）。
     *
     * 与主引擎唯一的有意分歧：主引擎用的是**加法**步长（scale + step），
     * 那是因为它的 scale 常年在 1 附近；而 Drunk 要让 2000~3700px 的整幅画布
     * 铺满视口，起始 scale 低到 0.15，缩放域跨 23 倍。此时同样的加法步长
     * 在小 scale 下相当于单次 +19%，捏合依旧会窜。故这里改成**按比例**缩放
     * （scale × e^(-deltaY·k)），任何缩放级别下手感一致。
     */

    /** 每个 wheel 事件的缩放灵敏度：捏合的 delta 天生比滚轮小得多，故系数更大 */
    const ZOOM_K_WHEEL = 0.0012;   // 鼠标滚轮一格 (deltaY=120) ≈ 15%
    const ZOOM_K_PINCH = 0.008;    // 触控板捏合

    function handleWheel(e) {
        if (!state.currentImageSrc && Object.keys(state.stations).length === 0) return;
        e.preventDefault();

        /** 单个事件的缩放倍率，并钳位防止异常大的 delta 一步跳飞 */
        const factorFor = (k) => {
            const f = Math.exp(-e.deltaY * k);
            return Math.max(0.75, Math.min(1.33, f));
        };

        // 触控板捏合缩放（macOS 会把捏合伪装成 ctrlKey + wheel）
        if (e.ctrlKey) {
            zoomToPoint(state.scale * factorFor(ZOOM_K_PINCH), e.clientX, e.clientY);
            return;
        }

        const mode = localStorage.getItem('nal_pref_wheel_mode') || 'smart';

        const doPan = () => panBy(-e.deltaX * 1.5, -e.deltaY * 1.5);
        const doZoom = () => zoomToPoint(state.scale * factorFor(ZOOM_K_WHEEL), e.clientX, e.clientY);

        if (mode === 'zoom') { doZoom(); return; }
        if (mode === 'pan') { doPan(); return; }

        // smart：先判是不是触控板
        const isTouchpad = (() => {
            if (Math.abs(e.deltaX) > 0) return true;       // 有横向分量必然是触控板
            if (e.deltaMode === 1) return false;            // 按行滚动是传统滚轮
            if (e.wheelDelta !== undefined) {
                if (Math.abs(e.wheelDelta) % 120 === 0) return false;  // 120 的整数倍是滚轮刻度
                if (Math.abs(e.wheelDelta) < 100) return true;
            }
            return Math.abs(e.deltaY) < 40;
        })();

        if (isTouchpad) doPan(); else doZoom();
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

        // PDF/AI 矢量直通的坐标已是画布像素，净化在画布坐标系内进行。
        // 矢量链路同样会吐脏数据：曲线化文字碎片、色板注记、重复图元。
        const sanitized = runSanitizer(
            result.stations || [], result.lines || [],
            result.width || state.mapSize.width, result.height || state.mapSize.height,
            'PDF / AI 矢量直通'
        );
        const rawStations = sanitized.stations;
        const rawLines = sanitized.lines;

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
        clearSelection();

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

    // ==========================================================================
    // 识别结果净化与几何校正（两条入料链路共用）
    // ==========================================================================

    /**
     * 跑一遍 DrunkSanitizer，并把处理结果写进诊断日志与状态栏。
     * 净化器是纯函数且已在 Node 侧做过回归，这里只负责接线与播报。
     */
    function runSanitizer(stations, lines, width, height, sourceLabel) {
        if (!window.DrunkSanitizer) return { stations, lines };

        const result = window.DrunkSanitizer.sanitize({ stations, lines, width, height });
        const r = result.report;
        const logger = window.DrunkLogger;

        const droppedTotal = r.dropped.junkName + r.dropped.offCanvas +
            r.dropped.duplicate + r.dropped.unreferenced + r.dropped.badGeometry;

        if (logger) {
            logger.group(`识别结果净化 (${sourceLabel})`);
            logger.info(`入料: ${r.input.stations} 站 / ${r.input.lines} 线 ➔ 出料: ${r.output.stations} 站 / ${r.output.lines} 线`);
            if (droppedTotal > 0) {
                logger.info(`丢弃明细: 脏站名 ${r.dropped.junkName} · 越界 ${r.dropped.offCanvas} · ` +
                    `同名幻觉 ${r.dropped.duplicate} · 无拓扑引用 ${r.dropped.unreferenced} · 坐标非法 ${r.dropped.badGeometry}`);
            }
            if (r.merged) logger.info(`同名换乘站合并为质心: ${r.merged} 处`);
            if (r.recoloredLines) logger.info(`线路撞色改判: ${r.recoloredLines} 条`);
            if (r.droppedLines.tooShort || r.droppedLines.duplicate) {
                logger.info(`退化线路剔除: 不足两站 ${r.droppedLines.tooShort} 条 · 与既有线重复 ${r.droppedLines.duplicate} 条`);
            }
            r.warnings.forEach(w => logger.warn(w));
            logger.groupEnd();
        }

        if (r.explosionGuard) {
            showNotification(`已拦截噪点爆炸：${r.input.stations} 个候选点中只有 ${r.output.stations} 个有线路拓扑支撑，其余按底图噪点丢弃。`);
        }

        return { stations: result.stations, lines: result.lines };
    }

    /**
     * 墨迹吸附 + 整体相似变换校正。
     * 解决「识别出来的站点整体相对底图歪了一截」——线条颜色是底图上最可靠的锚点。
     */
    function runInkSnap(stations, lines, width, height) {
        if (!window.DrunkSanitizer || !state.loadedImageEl) return stations;

        const out = window.DrunkSanitizer.snapToInk(
            stations, lines, state.loadedImageEl, { width, height }
        );
        const logger = window.DrunkLogger;
        const rep = out.report;

        if (logger) {
            logger.group('墨迹吸附与整体几何校正 (Ink Snapping)');
            if (rep.skipped) {
                logger.warn('底图画布被跨域数据污染，已跳过墨迹吸附。');
            } else if (rep.snapped === 0) {
                logger.warn('未能在底图上找到与线路配色相符的墨迹，已保留模型原始坐标。');
            } else {
                logger.info(`${rep.snapped}/${rep.total} 座车站吸附到底图线条上`);
                if (rep.transform) {
                    const t = rep.transform;
                    logger.info(`整体相似变换: 缩放 ${t.scale.toFixed(4)} · 旋转 ${t.rotationDeg.toFixed(2)}° · ` +
                        `平移 (${t.tx.toFixed(1)}, ${t.ty.toFixed(1)}) · RMSE ${t.rmse.toFixed(2)}`);
                    logger.info('吸附失败的站点（多半被站名文字压住）已按该变换一并拉正。');
                } else {
                    logger.info('吸附命中率偏低，未施加整体变换，仅保留逐点吸附结果。');
                }
            }
            logger.groupEnd();
        }

        return out.stations;
    }

    /**
     * 推断一批站点坐标所处的坐标系尺寸。
     * 视觉模型按约定输出 0~1000 归一化千分比，但偶尔会直接给原图像素坐标，
     * 净化器需要知道真实边界才能正确判定「越界」。
     */
    function detectCoordSpace(stations, fallbackW, fallbackH) {
        let maxX = 0, maxY = 0;
        (stations || []).forEach(s => {
            const x = Number(s.x), y = Number(s.y);
            if (Number.isFinite(x)) maxX = Math.max(maxX, x);
            if (Number.isFinite(y)) maxY = Math.max(maxY, y);
        });
        if (maxX <= 1000 && maxY <= 1000) return { width: 1000, height: 1000, normalized: true };
        return { width: fallbackW, height: fallbackH, normalized: false };
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
        let rawLines = Array.isArray(data.lines) ? data.lines : [];

        // 如果获取到了城市知识库，利用在线知识库进行站名模糊纠错与中英文权威补全
        if (cityKnowledge && window.CityKnowledgeMatcher) {
            rawStations = window.CityKnowledgeMatcher.matchAndAlignStations(rawStations, cityKnowledge);
        }

        // 2.5 识别结果净化：剔除噪点站、脏站名、同名重复与退化线路
        // 模型按约定返回 0~1000 归一化坐标，但偶尔会直接给原图像素坐标，先探明坐标系
        const baseW = state.loadedImageEl ? (state.loadedImageEl.naturalWidth || state.loadedImageEl.width) : state.mapSize.width;
        const baseH = state.loadedImageEl ? (state.loadedImageEl.naturalHeight || state.loadedImageEl.height) : state.mapSize.height;
        const space = detectCoordSpace(rawStations, baseW, baseH);

        ({ stations: rawStations, lines: rawLines } =
            runSanitizer(rawStations, rawLines, space.width, space.height, 'DeepSeek 视觉识图'));

        // 2.6 墨迹吸附：把站点拉回底图上真正的线条像素，并用整体相似变换校正系统性歪斜
        rawStations = runInkSnap(rawStations, rawLines, space.width, space.height);

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
        clearSelection();

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
        updateDirtyBadge();
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
    // ── OpenMap 线路数据模型访问器的本地别名（分支线路安全）──────────────────
    // 北京 S2/S6/JX、上海 SH5/SH10/SH11、悉尼 T1/T2/T4/T8 都是 hasbranch 分支线路，
    // 其站序写在 stationIds-way1/-way2 里而非 stationIds，直接 .length 会崩。
    function stationGroups(line) {
        return window.CityProjectIO
            ? window.CityProjectIO.lineStationGroups(line)
            : (Array.isArray(line.stationIds) ? [{ idsKey: 'stationIds', distKey: 'distances', ids: line.stationIds, distances: line.distances }] : []);
    }

    function pathGroups(line) {
        return window.CityProjectIO
            ? window.CityProjectIO.linePathGroups(line)
            : (Array.isArray(line.pathPoints) && line.pathPoints.length >= 2
                ? [{ key: 'pathPoints', points: line.pathPoints }] : []);
    }

    function allStationIds(line) {
        return window.CityProjectIO
            ? window.CityProjectIO.lineAllStationIds(line)
            : (line.stationIds || []);
    }

    // ── 倒角几何：与 core/script.js 共用 core/path-geometry.js 的同一份实现 ──
    // 预览与实际渲染必须产出逐字节相同的 path，否则在这里调出来的圆角是白调。
    function roundedPath(points, strict) {
        if (window.CGoPathGeometry) return window.CGoPathGeometry.generateRoundedPath(points, strict);
        // 几何模块没加载上时降级为直角折线，至少不白屏
        return points.reduce((d, p, i) => d + (i ? `L ${p.x} ${p.y} ` : `M ${p.x} ${p.y} `), '');
    }

    function cornerInfo(points, idx) {
        return window.CGoPathGeometry
            ? window.CGoPathGeometry.cornerRadiusAt(points, idx)
            : { isCorner: false, auto: 0, requested: 0, effective: 0, limited: false };
    }

    function renderLines() {
        dom.svgLinesLayer.innerHTML = '';
        dom.svgLinesLayer.setAttribute('width', state.mapSize.width);
        dom.svgLinesLayer.setAttribute('height', state.mapSize.height);

        state.lines.forEach((line, lineIdx) => {
            // isPointOnly 线路只在图上落站点图元，**不画走向**（引擎 renderLines 首行同此判定）。
            // 北京「中国铁路」Rwy2 就是 24 座散布全城的国铁车站，按站序直连会从延庆一路
            // 划到大兴，在编辑器里凭空多出一堆横穿全图的长斜线。合肥 S1、悉尼 MW/WSA 同理。
            if (line.isPointOnly) return;

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
            } else {
                // 走向来源（pathPoints / 分支 / 按站序兜底）的判定统一走
                // core/path-geometry.js 的 lineSegments，与引擎同源。
                const segs = window.CGoPathGeometry
                    ? window.CGoPathGeometry.lineSegments(line, state.stations)
                    : [];
                if (!segs.length) return; // 无几何数据，不画

                // 这条线的走向是「按站序兜底」推出来的（既无 pathPoints 也非分支线）
                const fromStations = !line.pathPoints && !line.hasbranch;

                segs.forEach(seg => {
                    const pts = (scaleX === 1 && scaleY === 1)
                        ? seg.points
                        : seg.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY, r: p.r }));

                    // 识图模式下数据未经人工核验，拓扑顺序可能整个是错的，
                    // 对站点兜底路径在超长跨度处打断，免得糊成一张穿刺全图的蛛网。
                    // 编辑模式忠实照搬引擎：不打断，否则画布上的断口在真实线路图上并不存在。
                    let chunks = [pts];
                    if (fromStations && state.mode !== 'edit') {
                        const MAX_SAFE_SPAN = state.mapSize.width * 0.35;
                        chunks = [];
                        let cur = [];
                        pts.forEach((pt, idx) => {
                            const prev = pts[idx - 1];
                            if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) > MAX_SAFE_SPAN) {
                                if (cur.length) chunks.push(cur);
                                cur = [];
                            }
                            cur.push(pt);
                        });
                        if (cur.length) chunks.push(cur);
                    }

                    chunks.forEach(chunk => {
                        if (chunk.length >= 2) d += roundedPath(chunk, line.useStrictRounding || false) + ' ';
                    });
                });
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
            path.setAttribute('data-line-idx', String(lineIdx));
            if (lineIdx === state.selectedLineIdx) path.classList.add('selected');

            // 点击线条本体即选中该线路（便于直接在画布上挑线，而不必去图例里找）
            path.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                selectLine(lineIdx);
            });

            dom.svgLinesLayer.appendChild(path);
        });

        renderVertices();
    }

    // ==========================================================================
    // 线路编辑：选中线路、改名改色、拖动走向折点
    // ==========================================================================

    /**
     * 渲染当前选中线路的走向折点手柄。
     * 只为选中的那一条渲染——全网折点合计上千个，全画出来既卡又没法点。
     */
    function renderVertices() {
        if (!dom.verticesLayer) return;
        dom.verticesLayer.innerHTML = '';

        const line = state.lines[state.selectedLineIdx];
        if (!line || line.isPointOnly) return;   // 走向都不画，就别显示折点手柄

        const scaleX = state.mapSize.width / (line._srcCanvasW || state.mapSize.width);
        const scaleY = state.mapSize.height / (line._srcCanvasH || state.mapSize.height);

        pathGroups(line).forEach(group => {
            group.points.forEach((pt, ptIdx) => {
                const handle = document.createElement('div');
                handle.className = 'path-vertex';
                const sel = state.selectedVertex;
                if (sel && sel.lineIdx === state.selectedLineIdx
                    && sel.groupKey === group.key && sel.ptIdx === ptIdx) {
                    handle.classList.add('selected');
                }
                handle.style.left = `${pt.x * scaleX}px`;
                handle.style.top = `${pt.y * scaleY}px`;
                handle.style.borderColor = line.color || '#006098';
                handle.title = `${line.name} · ${group.key}[${ptIdx}]`;

                // 拐角点画成圆形以示「此处可倒角」，端点保持方形
                const info = cornerInfo(group.points, ptIdx);
                if (info.isCorner) {
                    handle.classList.add('is-corner');
                    if (pt.r !== undefined) handle.classList.add('custom-radius');
                }

                handle.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    pushHistory();
                    state.selectedVertex = { lineIdx: state.selectedLineIdx, groupKey: group.key, ptIdx };
                    state.isDraggingVertex = true;
                    renderVertices();
                    syncCornerFields();
                });

                dom.verticesLayer.appendChild(handle);
            });
        });

        syncCornerFields();
    }

    /** 取出当前选中折点所在的点阵与下标 */
    function selectedVertexContext() {
        const sel = state.selectedVertex;
        if (!sel) return null;
        const line = state.lines[sel.lineIdx];
        const points = line && line[sel.groupKey];
        if (!Array.isArray(points) || !points[sel.ptIdx]) return null;
        return { sel, line, points, pt: points[sel.ptIdx] };
    }

    /** 把选中折点的圆角信息回填到面板 */
    function syncCornerFields() {
        if (!dom.cornerBox) return;
        const ctx = selectedVertexContext();

        if (!ctx) {
            dom.cornerBox.style.display = 'none';
            return;
        }
        dom.cornerBox.style.display = '';

        const info = cornerInfo(ctx.points, ctx.sel.ptIdx);
        const isAuto = ctx.pt.r === undefined;

        if (dom.fieldCornerRadius) {
            dom.fieldCornerRadius.value = isAuto ? '' : ctx.pt.r;
            dom.fieldCornerRadius.placeholder = info.isCorner ? `自动 ${info.auto}` : '端点无拐角';
            dom.fieldCornerRadius.disabled = !info.isCorner;
        }
        if (dom.cornerSlider) {
            dom.cornerSlider.value = Math.min(60, isAuto ? info.auto : (Number(ctx.pt.r) || 0));
            dom.cornerSlider.disabled = !info.isCorner;
        }

        if (dom.cornerHint) {
            if (!info.isCorner) {
                dom.cornerHint.textContent = '首尾端点不产生拐角，无法倒角。';
            } else if (info.limited) {
                // 这条提示很重要：用户填了 40 却只看到 12，不说明就会以为是 bug
                dom.cornerHint.textContent =
                    `当前生效 ${info.effective.toFixed(1)}px —— 相邻线段过短，已从 ${info.requested}px 自动收窄以免圆角互相重叠。`;
            } else if (isAuto) {
                dom.cornerHint.textContent =
                    `自动：按夹角判定为 ${info.auto === 18 ? '90° 直角' : '斜角'}，取 ${info.auto}px。填入数值即可覆盖，填 0 为保持直角。`;
            } else {
                dom.cornerHint.textContent = `自定义 ${ctx.pt.r}px（自动值为 ${info.auto}px）。清空输入框可恢复自动。`;
            }
        }

        // 面板里的选中折点标题
        if (dom.cornerTitle) {
            dom.cornerTitle.textContent = `${ctx.sel.groupKey}[${ctx.sel.ptIdx}]`;
        }
    }

    /**
     * 设置选中折点的圆角半径。
     * @param {number|null} r  null 表示恢复「自动」（删掉 r 字段，交回引擎按夹角判定）
     */
    function setCornerRadius(r) {
        const ctx = selectedVertexContext();
        if (!ctx) return;
        const info = cornerInfo(ctx.points, ctx.sel.ptIdx);
        if (!info.isCorner) return;

        const before = ctx.pt.r;
        pushHistory();
        if (r === null || r === undefined || r === '') delete ctx.pt.r;
        else ctx.pt.r = Math.max(0, round2(Number(r)));

        if (String(before) === String(ctx.pt.r)) { state.history.pop(); return; }

        renderLines();
        syncCornerFields();
        updateDirtyBadge();
    }

    /** 选中一条线路并把属性回填到检视面板 */
    function selectLine(idx) {
        const line = state.lines[idx];
        if (!line) return;
        state.selectedLineIdx = idx;
        state.selectedVertex = null;

        if (dom.lineCard) dom.lineCard.style.display = '';
        if (dom.fieldLineName) dom.fieldLineName.value = line.name || '';
        if (dom.fieldLineCompany) dom.fieldLineCompany.value = line.company || '';

        const color = normalizeHex(line.color);
        if (dom.fieldLineColor) dom.fieldLineColor.value = color;
        if (dom.fieldLineColorHex) dom.fieldLineColorHex.value = line.color || '';

        if (dom.fieldStrictRounding) dom.fieldStrictRounding.checked = !!line.useStrictRounding;
        if (dom.fieldPointOnly) dom.fieldPointOnly.checked = !!line.isPointOnly;
        if (dom.cornerBox) dom.cornerBox.style.display = 'none';

        const pts = pathGroups(line).reduce((a, g) => a + g.points.length, 0);
        if (dom.lineMeta) {
            dom.lineMeta.textContent = `${line.id} · ${allStationIds(line).length} 站 · `
                + (line.isPointOnly ? '仅落站点' : `${pts} 个走向折点`)
                + (line.hasbranch ? ' · 含分支' : '');
        }

        renderAll();
        highlightLine(line.id);
    }

    function deselectLine() {
        clearSelection();
        renderAll();
    }

    /**
     * 清空当前选中的线路 / 折点 / 车站，并收起线路检视卡片。
     *
     * 凡是**整体替换** state.lines / state.stations 的入口都必须调用它：
     * 换一座城市、识图出新结果、装载 PDF 矢量数据。否则 selectedLineIdx 会带着
     * 上一份数据的下标活到新数据里——线路卡片显示着上一座城市的线路名，
     * 折点手柄却画在新城市里碰巧同下标的另一条线上。
     */
    function clearSelection() {
        state.selectedLineIdx = -1;
        state.selectedVertex = null;
        state.selectedStationId = null;
        if (dom.lineCard) dom.lineCard.style.display = 'none';
        if (dom.inspectorStationName) dom.inspectorStationName.textContent = '未选中车站';
        if (dom.inspectorStationEn) dom.inspectorStationEn.textContent = '点击任意车站圆点或文字进行微调';
        if (dom.inspectorStationId) dom.inspectorStationId.textContent = 'ID: --';
        if (dom.inspectorAlignDisplay) dom.inspectorAlignDisplay.textContent = '--';
        [dom.fieldCn, dom.fieldEn, dom.fieldOffsetX, dom.fieldOffsetY,
        dom.fieldLineName, dom.fieldLineCompany, dom.fieldLineColorHex].forEach(el => {
            if (el) el.value = '';
        });
        if (dom.fieldType) dom.fieldType.value = 'dot';
        if (dom.cornerBox) dom.cornerBox.style.display = 'none';
        highlightActiveAlignWheel(null);
    }

    /** `<input type="color">` 只认 #RRGGBB，rgb() 与 3 位简写都要先归一化 */
    function normalizeHex(raw) {
        if (window.DrunkSanitizer) return window.DrunkSanitizer.normalizeColor(raw, 0);
        return /^#[0-9a-f]{6}$/i.test(raw || '') ? raw : '#006098';
    }

    function bindLineField(el, key, transform) {
        if (!el) return;
        el.addEventListener('change', () => {
            const line = state.lines[state.selectedLineIdx];
            if (!line) return;
            const value = transform ? transform(el.value) : el.value;
            if (key === 'name' && !String(value).trim()) {
                el.value = line.name || '';
                showNotification('线路名称不能为空。');
                return;
            }
            if (String(line[key] == null ? '' : line[key]) === String(value)) return;
            pushHistory();
            line[key] = value;
            if (key === 'color') refreshLineColors();   // 站点环色跟着线路标志色走
            selectLine(state.selectedLineIdx);
            updateDirtyBadge();
        });
    }

    /** 删除选中的走向折点；折线至少要保留两个点才能成线 */
    function deleteSelectedVertex() {
        const sel = state.selectedVertex;
        if (!sel) return false;
        const line = state.lines[sel.lineIdx];
        if (!line) return false;
        const points = line[sel.groupKey];
        if (!Array.isArray(points)) return false;
        if (points.length <= 2) {
            showNotification('折线至少需要保留 2 个折点，无法继续删除。');
            return true;
        }
        pushHistory();
        points.splice(sel.ptIdx, 1);
        state.selectedVertex = null;
        renderAll();
        syncCornerFields();
        updateDirtyBadge();
        showNotification(`已删除 ${line.name} 的 1 个走向折点，可按 Ctrl/Cmd+Z 撤销。`);
        return true;
    }

    /**
     * 在离点击处最近的那段折线上插入一个新折点。
     * 没有这个功能就只能挪现有折点，遇到需要加转角的走向改不动。
     */
    function insertVertexAt(lineIdx, mapX, mapY) {
        const line = state.lines[lineIdx];
        if (!line) return;

        let best = null;
        pathGroups(line).forEach(group => {
            for (let i = 0; i < group.points.length - 1; i++) {
                const a = group.points[i], b = group.points[i + 1];
                const vx = b.x - a.x, vy = b.y - a.y;
                const len2 = vx * vx + vy * vy;
                const t = len2 ? Math.max(0, Math.min(1, ((mapX - a.x) * vx + (mapY - a.y) * vy) / len2)) : 0;
                const px = a.x + vx * t, py = a.y + vy * t;
                const dist = Math.hypot(mapX - px, mapY - py);
                if (!best || dist < best.dist) {
                    best = { dist, groupKey: group.key, at: i + 1, x: px, y: py };
                }
            }
        });
        if (!best) return;

        pushHistory();
        line[best.groupKey].splice(best.at, 0, { x: round2(best.x), y: round2(best.y) });
        state.selectedVertex = { lineIdx, groupKey: best.groupKey, ptIdx: best.at };
        renderAll();
        updateDirtyBadge();
        showNotification(`已在 ${line.name} 上插入 1 个走向折点，拖动它即可调整走向。`);
    }

    /**
     * 渲染站点圆点
     */
    function renderStations() {
        dom.stationsLayer.innerHTML = '';

        const Icons = window.CGoStationIcons;

        Object.keys(state.stations).forEach(id => {
            const s = state.stations[id];
            const dot = document.createElement('div');
            // type 取值见 PORTING.md：dot 普通站 / tsf 换乘站 / rdot 国铁站 / no 暂缓开通站
            dot.className = `station-dot type-${s.type || 'dot'}`;
            dot.id = `dot-${id}`;
            dot.setAttribute('data-id', id);
            dot.title = `${s.cn || id}（${id}）`;
            dot.style.left = `${s.x}px`;
            dot.style.top = `${s.y}px`;

            // 图元画法与尺寸走 core/station-icons.js（与引擎同源）。
            // 早先是用 CSS 画的固定 14/18px 圆点，比引擎实际的 10/17.5px 大了一大圈，
            // 北京换乘站密集处糊成一片；上海的短横与换乘胶囊更是完全看不出来。
            if (Icons) {
                // 城市自定义画法与通用模板都按引擎的约定读 station.lineColors
                const sv = Object.assign({}, s, { lineColors: s._lineColors || [] });
                const custom = state.cityIconRenderer ? state.cityIconRenderer(sv, id) : null;
                if (custom && custom.html) {
                    dot.innerHTML = custom.html;
                    if (custom.className) dot.className += ' ' + custom.className;
                    dot.style.width = `${custom.width || Icons.sizeFor(s.type)}px`;
                    dot.style.height = `${custom.height || Icons.sizeFor(s.type)}px`;
                    dot.classList.add('has-svg-icon');
                } else {
                    const size = Icons.sizeFor(s.type);
                    dot.innerHTML = Icons.iconHtmlFor(sv);
                    dot.style.width = `${size}px`;
                    dot.style.height = `${size}px`;
                    dot.classList.add('has-svg-icon');
                }
                dot.style.zIndex = (Icons.STATION_Z[s.type] || 15) + 10;
            }

            // 点击选中与拖拽监听
            dot.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                // 拖拽前压栈一次，整段拖拽算一步撤销
                pushHistory();
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

    /**
     * 站名标签定位。
     * offset 是 OpenMap 站名排版的核心字段（悉尼/北京几乎每座车站都用到），
     * 编辑模式下必须如实反映，否则「所见」与线路图实际渲染对不上，
     * 调出来的方位就是错的。
     */
    function updateSingleLabelStyle(labelEl, station) {
        const off = station.offset || { x: 0, y: 0 };
        labelEl.style.left = `${station.x + (off.x || 0)}px`;
        labelEl.style.top = `${station.y + (off.y || 0)}px`;
        labelEl.className = `station-label align-${station.align || 'top'}`;
        if (station.hideLabel) labelEl.classList.add('label-hidden');
        if (station.labelBold) labelEl.classList.add('label-bold');
        if (station.labelSize === 'big') labelEl.classList.add('label-big');
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
        if (dom.inspectorStationEn) dom.inspectorStationEn.textContent = s.en || '（无英文名）';
        if (dom.inspectorStationId) dom.inspectorStationId.textContent = `ID: ${id}`;
        if (dom.inspectorAlignDisplay) dom.inspectorAlignDisplay.textContent = s.align || 'top';

        syncInspectorFields(s);
        highlightActiveAlignWheel(s.align || 'top');
    }

    /** 把选中站点的可编辑字段回填到检视面板 */
    function syncInspectorFields(s) {
        if (!s) return;
        if (dom.fieldCn) dom.fieldCn.value = s.cn || '';
        if (dom.fieldEn) dom.fieldEn.value = s.en || '';
        if (dom.fieldType) dom.fieldType.value = s.type || 'dot';
        const off = s.offset || { x: 0, y: 0 };
        if (dom.fieldOffsetX) dom.fieldOffsetX.value = off.x || 0;
        if (dom.fieldOffsetY) dom.fieldOffsetY.value = off.y || 0;
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
            countSpan.textContent = `${allStationIds(line).length} 站`;

            item.appendChild(colorBadge);
            item.appendChild(nameSpan);
            item.appendChild(countSpan);

            if (state.lines.indexOf(line) === state.selectedLineIdx) item.classList.add('active');

            item.addEventListener('click', () => {
                const idx = state.lines.indexOf(line);
                if (idx === state.selectedLineIdx) deselectLine();
                else selectLine(idx);
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
    /**
     * 编辑模式导出：对 data_stations.js / data_lines.js 执行条目级外科手术回写。
     *
     * 只有**确实被改动过**的条目会被重写，其余条目（连同注释、缩进、字段顺序、
     * 以及 Drunk 压根不认识的 marker / halo / textScale 等字段）逐字节保持原样。
     * 生成的文件可以直接覆盖回 city/{id}/，diff 里只会出现你亲手改的那几行。
     */
    function exportEditedCity() {
        const project = state.project;
        const changedStations = diffStations();
        const changedLines = diffLines();
        const removed = removedStationIds();

        if (!changedStations.length && !changedLines.length && !removed.length) {
            showNotification('当前没有任何改动，无需导出。');
            return;
        }

        const files = [];
        const notes = [];

        // ---- data_stations.js ----
        if (changedStations.length || removed.length) {
            const update = {};
            const append = [];
            changedStations.forEach(id => {
                if (project.data.stationsData[id]) update[id] = state.stations[id];
                else append.push({ key: id, value: state.stations[id] });
            });
            try {
                const patched = window.CityProjectIO.patchEntries(
                    project.sources['data_stations.js'], 'stationsData',
                    { update, remove: removed, append }
                );
                files.push({ name: 'data_stations.js', text: patched });
            } catch (err) {
                showNotification(`data_stations.js 回写失败：${err.message}`);
                return;
            }
        }

        // ---- data_lines.js ----
        if (changedLines.length) {
            const update = {};
            changedLines.forEach(idx => { update[String(idx)] = state.lines[idx]; });
            try {
                const patched = window.CityProjectIO.patchEntries(
                    project.sources['data_lines.js'], 'linesData', { update }
                );
                files.push({ name: 'data_lines.js', text: patched });
            } catch (err) {
                showNotification(`data_lines.js 回写失败：${err.message}`);
                return;
            }
        }

        // ---- 人工确认提示：挪过站的线路，其 pathPoints 折线不会自动跟着动 ----
        const movedIds = changedStations.filter(id => {
            const before = project.data.stationsData[id];
            const after = state.stations[id];
            return before && after && (before.x !== after.x || before.y !== after.y);
        });
        if (movedIds.length) {
            const affected = state.lines.filter(l =>
                Array.isArray(l.pathPoints) && l.pathPoints.length >= 2 &&
                Array.isArray(l.stationIds) && l.stationIds.some(sid => movedIds.includes(sid))
            ).map(l => l.name);
            if (affected.length) {
                notes.push(
                    `你挪动了 ${movedIds.length} 座车站，但 ${[...new Set(affected)].join('、')} ` +
                    `的 pathPoints 折线是独立几何，不会自动跟随。若站点已偏离线形，请在 data_lines.js 中同步折点。`
                );
            }
        }
        if (removed.length) {
            notes.push(`已删除 ${removed.length} 座车站，并同步从线路 stationIds 与 distances 中摘除。`);
        }

        // ---- 数据完整性自检 ----
        const report = window.DrunkCodeGen.validateData(state.stations, state.lines);
        if (!report.isValid) {
            notes.push(`⚠ 自检发现 ${report.errors.length} 项错误，导出的文件可能无法正常渲染：\n  · ` +
                report.errors.slice(0, 6).join('\n  · '));
        }

        const header = [
            `// ${project.name} (${project.id}) — Drunk 编辑模式改动导出`,
            `// 改动条目：车站 ${changedStations.length} 处，线路 ${changedLines.length} 处，删除 ${removed.length} 处`,
            `// 未改动的条目逐字节保持原样，可直接覆盖回 ${project.base.replace('../', '')}/`,
            notes.length ? '//\n// ' + notes.join('\n// ') : ''
        ].filter(Boolean).join('\n');

        const preview = header + '\n\n' + files.map(f =>
            `// ================== ${f.name} ==================\n` +
            `// （完整文件已生成，点击下方「下载改动文件」保存；此处仅列出改动摘要）\n` +
            summarizeChanges(f.name, changedStations, changedLines, removed)
        ).join('\n\n');

        state._exportFiles = files;
        openExportModal(preview, true);

        const logger = window.DrunkLogger;
        if (logger) {
            logger.banner('编辑模式改动回写完成', `${project.name} (${project.id})`);
            logger.info(`改写文件: ${files.map(f => f.name).join(', ')}`);
            logger.info(`车站改动 ${changedStations.length} 处 / 线路改动 ${changedLines.length} 处 / 删除 ${removed.length} 处`);
            notes.forEach(n => logger.warn(n));
        }
    }

    /** 生成一份人类可读的改动清单（用于导出预览） */
    function summarizeChanges(fileName, changedStations, changedLines, removed) {
        const project = state.project;
        const rows = [];
        if (fileName === 'data_stations.js') {
            changedStations.forEach(id => {
                const b = project.data.stationsData[id];
                const a = state.stations[id];
                if (!b) { rows.push(`  + 新增 ${id} "${a.cn}"`); return; }
                const parts = [];
                if (b.x !== a.x || b.y !== a.y) parts.push(`坐标 (${b.x}, ${b.y}) → (${a.x}, ${a.y})`);
                if (b.cn !== a.cn) parts.push(`中文名 "${b.cn}" → "${a.cn}"`);
                if ((b.en || '') !== (a.en || '')) parts.push(`英文名 "${b.en || ''}" → "${a.en || ''}"`);
                if ((b.align || 'top') !== (a.align || 'top')) parts.push(`朝向 ${b.align || 'top'} → ${a.align || 'top'}`);
                const bo = b.offset || { x: 0, y: 0 }, ao = a.offset || { x: 0, y: 0 };
                if (bo.x !== ao.x || bo.y !== ao.y) parts.push(`偏移 (${bo.x}, ${bo.y}) → (${ao.x}, ${ao.y})`);
                if ((b.type || 'dot') !== (a.type || 'dot')) parts.push(`类型 ${b.type || 'dot'} → ${a.type || 'dot'}`);
                rows.push(`  ~ ${id} "${a.cn}"：${parts.length ? parts.join('，') : '其它字段变更'}`);
            });
            removed.forEach(id => {
                rows.push(`  - 删除 ${id} "${project.data.stationsData[id].cn}"`);
            });
        } else {
            changedLines.forEach(idx => {
                const b = project.data.linesData[idx];
                const a = state.lines[idx];
                const parts = [];
                if (b.name !== a.name) parts.push(`名称 "${b.name}" → "${a.name}"`);
                if (b.color !== a.color) parts.push(`颜色 ${b.color} → ${a.color}`);
                // 分支线路的站序写在 stationIds-way1/-way2 里，逐组比对才说得清改了哪一支
                const beforeGroups = stationGroups(b);
                const afterGroups = stationGroups(a);
                afterGroups.forEach(ag => {
                    const bg = beforeGroups.find(g => g.idsKey === ag.idsKey);
                    if (!bg) { parts.push(`新增站序 ${ag.idsKey} (${ag.ids.length} 站)`); return; }
                    if (bg.ids.length !== ag.ids.length) {
                        const gone = bg.ids.filter(id => !ag.ids.includes(id));
                        parts.push(`${ag.idsKey} ${bg.ids.length} → ${ag.ids.length} 站` +
                            (gone.length ? `（移除 ${gone.join('、')}）` : ''));
                    }
                });

                // 走向折点：逐组比对增删与位移，否则拖了半天线形在摘要里一个字都看不到
                pathGroups(a).forEach(ag => {
                    const bg = pathGroups(b).find(g => g.key === ag.key);
                    if (!bg) { parts.push(`新增走向 ${ag.key} (${ag.points.length} 折点)`); return; }
                    if (bg.points.length !== ag.points.length) {
                        parts.push(`${ag.key} 折点 ${bg.points.length} → ${ag.points.length}`);
                        return;
                    }
                    const moved = ag.points.filter((p, i) =>
                        p.x !== bg.points[i].x || p.y !== bg.points[i].y).length;
                    if (moved) parts.push(`${ag.key} 挪动 ${moved} 个折点`);

                    // 圆角半径 r 与坐标同样重要：北京/合肥本来就靠它做大弯，
                    // 上海/悉尼则是逐点 r:0 保持直角，改动必须如实播报
                    const radiusChanges = [];
                    ag.points.forEach((p, i) => {
                        const q = bg.points[i];
                        if (!q || p.r === q.r) return;
                        const fmt = (v) => (v === undefined ? '自动' : `${v}px`);
                        radiusChanges.push(`[${i}] ${fmt(q.r)}→${fmt(p.r)}`);
                    });
                    if (radiusChanges.length) {
                        parts.push(`${ag.key} 圆角 ${radiusChanges.slice(0, 4).join('、')}`
                            + (radiusChanges.length > 4 ? ` 等 ${radiusChanges.length} 处` : ''));
                    }
                });

                rows.push(`  ~ [${idx}] ${a.name}：${parts.length ? parts.join('，') : '其它字段变更'}`);
            });
        }
        return rows.join('\n') || '  （无）';
    }

    /** 打开导出预览弹窗；showDownload 为 true 时启用「下载改动文件」按钮 */
    function openExportModal(text, showDownload) {
        const modal = document.getElementById('export-modal');
        const textarea = document.getElementById('export-code-preview');
        const dlBtn = document.getElementById('btn-download-export');
        if (textarea) textarea.value = text;
        if (dlBtn) dlBtn.style.display = showDownload ? '' : 'none';
        if (modal) modal.classList.add('active');
    }

    /** 把编辑模式生成的改动文件逐个另存到本地 */
    function downloadExportFiles() {
        const files = state._exportFiles || [];
        if (!files.length) {
            showNotification('没有可下载的改动文件。');
            return;
        }
        files.forEach((f, i) => {
            setTimeout(() => window.CityProjectIO.downloadText(f.name, f.text), i * 250);
        });
        showNotification(`正在保存 ${files.map(f => f.name).join('、')}，请覆盖回 ${state.project.base.replace('../', '')}/`);
    }

    function exportCityFiles() {
        if (Object.keys(state.stations).length === 0) {
            showNotification("暂无任何站点数据，请先上传底图识别，或从上方下拉框载入一座已有城市。");
            return;
        }

        if (state.mode === 'edit' && state.project) {
            exportEditedCity();
            return;
        }

        const stationsJs = window.DrunkCodeGen.generateStationsJs(state.cityId, state.cityName, state.stations);
        const linesJs = window.DrunkCodeGen.generateLinesJs(state.cityId, state.cityName, state.lines);
        const legendJs = window.DrunkCodeGen.generateLegendJs(state.cityId, state.cityName, state.lines);
        const mainJs = window.DrunkCodeGen.generateCityMainJs(state.cityId, state.cityName, state.lines);

        // 新城市转换产物：四个文件整包生成，同时挂到下载队列
        state._exportFiles = [
            { name: 'data_stations.js', text: stationsJs },
            { name: 'data_lines.js', text: linesJs },
            { name: 'data_legend.js', text: legendJs },
            { name: `${state.cityId}.js`, text: mainJs }
        ];

        openExportModal(
            `// ================== 1. data_stations.js ==================\n${stationsJs}\n\n` +
            `// ================== 2. data_lines.js ==================\n${linesJs}\n\n` +
            `// ================== 3. data_legend.js ==================\n${legendJs}\n\n` +
            `// ================== 4. ${state.cityId}.js ==================\n${mainJs}`,
            true
        );

        const logger = window.DrunkLogger;
        if (logger) {
            logger.info(`[代码导出] 已生成 OpenMap 标准城市工程包 (涵盖 data_stations.js, data_lines.js, data_legend.js, ${state.cityId}.js)`);
        }
    }

    let notifyTimer = null;

    function showNotification(msg) {
        const banner = document.getElementById('notification-toast');
        if (!banner) return;
        banner.textContent = msg;
        banner.classList.add('show');
        // 连续弹提示时，旧的定时器会提前把新消息关掉，必须先清掉
        if (notifyTimer) clearTimeout(notifyTimer);
        // 多行错误提示需要更长的阅读时间
        const dwell = Math.min(12000, Math.max(3800, String(msg).length * 90));
        notifyTimer = setTimeout(() => {
            banner.classList.remove('show');
            notifyTimer = null;
        }, dwell);
    }

    return {
        init,
        runAutoConvert,
        snapGrid,
        exportCityFiles,
        showNotification,
        // 视口
        zoomBy,
        resetView: fitToViewport,
        // 编辑模式
        loadExistingCity,
        downloadExportFiles,
        undo
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.DrunkPipeline.init();
});
