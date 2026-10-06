/**
 * CGo OpenMap - 石家庄城市业务逻辑 (city/shijiazhuang/shijiazhuang.js)
 * 更新计划：
 * 		1.石家庄站-欧韵公园美化；√
 * 		2.增设国铁车站；              
 * 		3.走向优化：取消使用via；√
 * 		4.增加高德地图信息；       
 * 		5.美化区间用时卡片，修改大小；
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */


(function () {
    'use strict';

    (function loadCityStylesheet() {
        const href = "./city/shijiazhuang/style.css";
        if (document.querySelector(`link[href^="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        const v = window.CGO_ASSET_VERSION;
        link.href = v ? `${href}?v=${v}` : href;
        document.head.appendChild(link);
    })();

    const ShijiazhuangCity = {
        id: "shijiazhuang",
        name: "石家庄",
        maintainers: [
            { name: "已码凉", role: "城市主理人", github: "https://github.com/Yimaliang" }
        ],
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2", "M3"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: ["M106", "M109", "M210"],
        CROSS_PLATFORM_STATIONS: [],
        searchCity: "石家庄",
        MAP_12306: { "石家庄站": "石家庄", "石家庄东站": "石家庄东" },
        getNavigationUrl(stationName, isSuburbanOrRail) {
            const mapSearchName = isSuburbanOrRail
                ? stationName.replace(/站$/, '') + "火车站"
                : stationName + "地铁站";
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(mapSearchName)}&city=${encodeURIComponent(this.searchCity)}`;
        },
        getRailway12306Url(stationName) {
            const nameFor12306 = this.MAP_12306[stationName] || stationName.replace(/站$/, '');
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(nameFor12306)}`;
        },
        getSuburbanLinks() { return { timetableUrl: "预留网址", ticketUrl: "预留网址" }; },
        officialMapUrl: "预留网址",
        dataFiles: {
            stanameCsvUrl: './city/shijiazhuang/staname.csv',
        },
        formatOwnerName(rawOwnerName) { return rawOwnerName || "石家庄市轨道交通有限责任公司"; },
        formatCompanyString(companyList) { return [...new Set(companyList)].join("，"); },
        stacard: {
            script: './city/shijiazhuang/stacard/script.js',
            basePath: './city/shijiazhuang/stacard/',
            getRenderer: () => window.ShijiazhuangStaCard || window.StaCard || null
        },
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({ basePath: this.stacard.basePath, geoDataUrl: this.stacard.geoDataUrl, ...options });
        },
        hasStaCard(stationId, lineId, stationInfo) {
            return Boolean(this.stacard.getRenderer()?.hasCard?.(stationId, lineId, stationInfo));
        },
        getStaCardHtml(station, lineInfo, isCrossPlatform = false) {
            return this.stacard.getRenderer()?.getCardPlaceholderHtml?.(station, lineInfo, isCrossPlatform) || '';
        },
        async renderStaCards(infoPanel, station) {
            return await this.stacard.getRenderer()?.renderPanelCards?.(infoPanel, station);
        },
        stationBoard: {
            scripts: ['modules/shijiazhuang_cultural.js'],
            modules: {
                'header-controls': { enabled: true, order: 10 },
                'header-title': { enabled: true, order: 20 },
                'header-badges': { enabled: true, order: 30 },
                'stacard': { enabled: true, targetTab: 'line-tab', order: 10 },
                'adjacent-stations': { enabled: true, targetTab: 'line-tab', order: 20 },
                'transfers': { enabled: true, targetTab: 'line-tab', order: 30 },
                'station-type': { enabled: true, targetTab: 'station-info', order: 10 },
                'shijiazhuang-cultural-tip': { enabled: true, targetTab: 'station-info', order: 15 },
                'operators': { enabled: true, targetTab: 'station-info', order: 20 },
                'footer-actions': { enabled: true, order: 10 }
            }
        },

        renderStationIcon(s, id) {
            const color = (s.lineColors && s.lineColors.length > 0) ? s.lineColors[0] : '#00263b';
            if (s.type === 'terminus') {
                return {
                    html: `<svg viewBox="0 0 10 10" width="10" height="10" style="display:block;"><circle cx="5" cy="5" r="5" style="fill:${color};"/><circle cx="5" cy="5" r="3.6" style="fill:var(--map-bg);"/><circle cx="5" cy="5" r="2.2" style="fill:${color};"/></svg>`,
                    width: 10, height: 10
                };
            }
            if (s.type === 'scenery') {
                return {
                    html: `<svg viewBox="0 0 10 10" width="10" height="10" style="display:block;"><circle cx="5" cy="5" r="5" style="fill:var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:#52C41A;"/><circle cx="5" cy="5" r="3.5" style="fill:var(--map-bg);"/></svg>`,
                    width: 10, height: 10
                };
            }
            if (s.type === 'railcity') {
                return {
                    html: `<svg viewBox="0 0 10 10" width="6" height="6" style="display:block;"><circle cx="5" cy="5" r="5" style="fill:var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:#1B3A6B;"/><circle cx="5" cy="5" r="3.5" style="fill:var(--map-bg);"/></svg>`,
                    width: 6, height: 6
                };
            }
            return null;
        }
    };

    window.SHIJIAZHUANG_CONFIG = {
        cityId: "shijiazhuang",
        cityName: "石家庄",
        stationTypes: {
            terminus: { render: "terminus", clickable: true },
            scenery:  { render: "scenery",  clickable: true },
            railcity: { render: "railcity", clickable: true },
            rdot:     { render: "rdot",     clickable: true }
        }
    };

    window.showLineInfoCard = function (station) {
      if (!station || !station.lineInfo) return;
      removeExistingCard('.line-info-card');
      const info = station.lineInfo;
      let lineColor = '#E4002B';
      if (typeof linesData !== 'undefined') {
         const line = linesData.find(l => l.id === info.lineId);
         if (line) lineColor = line.color;
     }
      const lineNum = info.lineId.replace(/[^0-9]/g, '');
      const card = document.createElement('div');
     card.className = 'cgo-glass-card line-info-card';
     card.style.setProperty('--tc-line', lineColor);
      card.innerHTML = `
         <div class="tc-row1">
            <span class="tc-line"></span>
              <span class="tc-icon">${lineNum}</span>
              <span class="tc-text">${lineNum}号线 · Line ${lineNum}</span>
             <span class="tc-line"></span>
        </div>
         <div class="tc-body">
              <div class="tc-dir">${info.from} → ${info.to}</div>
              <div class="tc-train">
                 <span>首班车 <b>${info.firstTrain}</b></span>
                  <span>末班车 <b>${info.lastTrain}</b></span>
              </div>
         </div>
     `;
      document.body.appendChild(card);
     bindOutsideClose(card);
  };

    function getSceneryLineInfo(sceneryCn) {
        if (typeof sceneryLines === 'undefined') return { lineName: '', stationName: '', stationNameEn: '', color: '#E4002B' };
        const sl = sceneryLines.find(s => {
            if (!s.stationIds || s.stationIds.length < 2) return false;
            const sc = (typeof stationsData !== 'undefined') ? stationsData[s.stationIds[1]] : null;
            return sc && sc.cn === sceneryCn;
        });
       if (!sl) return { lineName: '', stationName: '', stationNameEn: '', color: '#E4002B' };
       const metroSid = sl.stationIds[0];
       const metroSta = (typeof stationsData !== 'undefined') ? stationsData[metroSid] : null;
        let lineName = '';
       let color = '#E4002B';
       if (typeof linesData !== 'undefined') {
            const line = linesData.find(l => l.stationIds && l.stationIds.includes(metroSid));
            if (line) {
               lineName = line.name;
                color = line.color;
           }
       }
        return {
            lineName,
           stationName: metroSta ? metroSta.cn : '',
            stationNameEn: metroSta ? (metroSta.en || '') : '',
           color
        };
    }
    window.showSceneryCard = function (station) {
    if (!station) return;
    removeExistingCard('.scenery-card');
    const info = getSceneryLineInfo(station.cn);
    const lineName = info.lineName || '';
    const stationName = info.stationName || '';
    const stationNameEn = info.stationNameEn || '';
    const lineStationText = (lineName && stationName) ? `${lineName} · ${stationName}` : (lineName || stationName || '—');
    const lineNum = lineName.replace(/[^0-9]/g, '');
    const lineStationEn = (lineNum && stationNameEn) ? `Line ${lineNum} · ${stationNameEn} Station` : '';

    const card = document.createElement('div');
    card.className = 'cgo-glass-card scenery-card';
    card.innerHTML = `
        <div class="sc-header">
          <div class="sc-line"></div>
          <div class="sc-capsule">
           <span class="sc-capsule-icon">景</span>
           <span>${lineStationText}</span>
         </div>
        </div>
        <div class="sc-body">
            <div class="sc-title-row">
                <div class="sc-title">${station.cn || ''}</div>
                <div class="sc-tri"></div>
                <div class="sc-sub-line">
                    <span class="sc-en">${lineStationEn}</span>
                </div>
            </div>
            <div class="sc-intro-title">简介 · Introduction</div>
            <div class="sc-text">${station.intro || '暂无简介'}</div>
            <a class="sc-btn" href="${station.website || '#'}" target="_blank" rel="noopener">百度百科</a>
        </div>
    `;
    document.body.appendChild(card);
    bindOutsideClose(card);
};

    window.showSegmentBubble = function (line, fromStation, toStation, time, midPoint) {
     if (!line || !fromStation || !toStation || !midPoint) return;
      removeExistingCard('.segment-card');
      const content = document.getElementById('map-content');
     if (!content) return;
      const card = document.createElement('div');
     card.className = 'segment-card';
     card.style.left = midPoint.x + 'px';
      card.style.top = midPoint.y + 'px';
      card.innerHTML = `
          <div class="seg-bar"></div>
         <div class="seg-body">
             <div class="seg-station">${fromStation.cn}</div>
             <div class="seg-station-en">${fromStation.en || ''}</div>
              <div class="seg-arrow">↕</div>
              <div class="seg-station">${toStation.cn}</div>
             <div class="seg-station-en">${toStation.en || ''}</div>
             <div class="seg-time">约 <b>${time}</b> 分钟</div>
         </div>
      `;
      content.appendChild(card);
      setTimeout(() => {
          const closeHandler = (e) => {
              if (!card.contains(e.target)) {
                 card.remove();
                  document.removeEventListener('click', closeHandler);
             }
         };
          document.addEventListener('click', closeHandler);
      }, 0);
  };

  
    window.showRailCityCard = function (station) {
    if (!station) return;
    removeExistingCard('.railcity-card');

    // 从 railCityLines 查该城市对应的线路名
    let railNames = '';
    if (typeof railCityLines !== 'undefined') {
        const rc = railCityLines.find(r =>
            r.name === station.cn ||
            (r.toStation && r.toStation === ('C_' + station.cn)) ||
            (r.stationIds && r.stationIds.some(id => {
                const st = typeof stationsData !== 'undefined' ? stationsData[id] : null;
                return st && st.cn === station.cn;
            }))
        );
        if (rc && rc.railName) railNames = rc.railName;
    }

    const intro = railNames
        ? `从石家庄站乘坐${railNames}出发，可达${station.cn}。`
        : `从石家庄站乘坐铁路出发，可达${station.cn}。`;

    const card = document.createElement('div');
    card.className = 'cgo-glass-card railcity-card';
    card.innerHTML = `
        <div class="rc-header">
            <span class="rc-bar"></span>
            <span class="rc-icon">城</span>
            <span class="rc-title">${station.cn || ''}</span>
            <span class="rc-bar"></span>
        </div>
        <div class="rc-body">
            <div class="rc-sub">${station.en || ''}</div>
            <div class="rc-intro">${intro}</div>
        </div>
        <div class="rc-action">
            <a class="rc-btn" href="${station.website || '#'}" target="_blank" rel="noopener">前往${station.cn || ''}</a>
        </div>
    `;
    document.body.appendChild(card);
    bindOutsideClose(card);
};

window.openRailCityWebsite = function (station) {
    window.showRailCityCard(station);
};

    function removeExistingCard(selector) {
        const old = document.querySelector(selector);
        if (old) old.remove();
    }
    function bindOutsideClose(card) {
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!card.contains(e.target)) {
                    card.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 0);
    }

    window.SHIJIAZHUANG_CITY = ShijiazhuangCity;
    window.CURRENT_CITY = ShijiazhuangCity;

    if (typeof document !== 'undefined' && typeof document.write === 'function') {
        document.write('<scr' + 'ipt src="./city/shijiazhuang/modules/shijiazhuang_cultural.js?v=260919.010000"><\/scr' + 'ipt>');
    }

    window.CityDataManager?.registerCity?.({
        id: ShijiazhuangCity.id,
        name: ShijiazhuangCity.name,
        folder: "./city/shijiazhuang",
        mainLogic: "./city/shijiazhuang/shijiazhuang.js",
        isDefault: false,
        ...ShijiazhuangCity
    });

    console.log("[ShijiazhuangCity] 石家庄城市专属业务逻辑模块加载完成。");

    // ==================== 站点点击绑定 ====================
    (function bindStationClicks() {
        function dispatch(s, e) {
            if (window.isMapDragging) return;
            if (e) { e.stopPropagation(); e.preventDefault(); }
            if (s.type === 'scenery')  { window.showSceneryCard(s); return; }
            if (s.type === 'rdot')     { window.showRailCard(s); return; }
            if (s.type === 'railcity') { window.openRailCityWebsite(s); return; }
            if (s.type === 'terminus') { window.showLineInfoCard(s); return; }
        }

        function bindDirect(layer) {
            layer.querySelectorAll('.station').forEach(el => {
                if (el.dataset.sjzBound === '1') return;
                const sid = el.dataset.sid;
                const s = typeof stationsData !== 'undefined' ? stationsData[sid] : null;
                if (!s) return;
                const need = s.type === 'scenery' || s.type === 'rdot' || s.type === 'railcity' || s.type === 'terminus';
                if (!need) return;
                el.dataset.sjzBound = '1';
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => dispatch(s, e), true);
                el.addEventListener('mousedown', (e) => e.stopPropagation(), true);
            });
        }

        function tryBind(retries = 0) {
            const layer = document.getElementById('stations-layer');
            if (!layer) {
                if (retries < 40) return setTimeout(() => tryBind(retries + 1), 100);
                return;
            }
            bindDirect(layer);
            setTimeout(() => bindDirect(layer), 300);
            setTimeout(() => bindDirect(layer), 800);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => tryBind());
        } else {
            tryBind();
        }
        window.addEventListener('cgo-city-change', () => setTimeout(() => tryBind(), 300));
    })();;

    // (function bindSceneryLabelClicks() {
    //     function bindLabels(layer) {
    //         if (!layer) return;
    //         layer.querySelectorAll('.label-group').forEach(el => {
    //             if (el.dataset.sjzLabelBound === '1') return;
    //             const sid = el.dataset.sid;
    //             if (!sid || !sid.startsWith('S_')) return;
    //             const s = typeof stationsData !== 'undefined' ? stationsData[sid] : null;
    //             if (!s || s.type !== 'scenery') return;
    //             el.dataset.sjzLabelBound = '1';
    //             el.style.cursor = 'pointer';
    //             el.addEventListener('click', (e) => {
    //                 if (window.isMapDragging) return;
    //                 e.stopPropagation();
    //                 window.showSceneryCard(s);
    //             }, true);
    //         });
    //     }
    //     function tryBind(retries = 0) {
    //         const layer = document.getElementById('labels-layer');
    //         if (!layer) {
    //             if (retries < 40) return setTimeout(() => tryBind(retries + 1), 100);
    //             return;
    //         }
    //         bindLabels(layer);
    //         setTimeout(() => bindLabels(layer), 300);
    //         setTimeout(() => bindLabels(layer), 800);
    //     }
    //     if (document.readyState === 'loading') {
    //         document.addEventListener('DOMContentLoaded', () => tryBind());
    //     } else {
    //         tryBind();
    //     }
    //     window.addEventListener('cgo-city-change', () => setTimeout(() => tryBind(), 300));
    // })();

    // (function applySceneryLineWidth() {
    //     function apply() {
    //         document.querySelectorAll('.line-visual-group').forEach(g => {
    //             const vid = g.dataset.visualId || '';
    //             if (!vid.startsWith('SC_')) return;
    //             g.querySelectorAll('.line-visual-inner, .line-visual-outer, .line-interaction').forEach(p => {
    //                 p.style.strokeWidth = '10px';
    //                 p.style.strokeLinecap = 'round';
    //             });
    //         });
    //     }
    //     if (document.readyState === 'loading') {
    //         document.addEventListener('DOMContentLoaded', () => { setTimeout(apply, 500); setTimeout(apply, 1200); });
    //     } else {
    //         setTimeout(apply, 500); setTimeout(apply, 1200);
    //     }
    //     window.addEventListener('cgo-city-change', () => { setTimeout(apply, 500); setTimeout(apply, 1200); });
    // })();

(function injectSegmentHotspots() {
    function tryInject(retries = 0) {
        const linesLayer = document.getElementById('lines-layer');
        if (!linesLayer) {
            if (retries < 40) return setTimeout(() => tryInject(retries + 1), 100);
            return;
        }
        const groups = linesLayer.querySelectorAll('.line-visual-group[data-visual-id]');
        if (groups.length === 0) {
            if (retries < 40) return setTimeout(() => tryInject(retries + 1), 100);
            return;
        }
        injectAll();
    }

    function injectAll() {
        if (typeof linesData === 'undefined') return;
        linesData.forEach(line => {
            const group = document.querySelector(`.line-visual-group[data-visual-id="${line.id}"]`);
            if (!group) return;
            if (group.querySelector('.line-segment-hotspot')) return;

            if (typeof processedStations === 'undefined') return;
            const pts = line.stationIds.map(sid => {
                const s = processedStations[sid];
                return s ? { x: s.x, y: s.y } : null;
            });
            if (pts.length < 2 || pts.some(p => !p)) return;

            const frag = document.createDocumentFragment();
            for (let i = 0; i < pts.length - 1; i++) {
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const seg = document.createElementNS("http://www.w3.org/2000/svg", "path");
                seg.setAttribute("d", `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
                seg.setAttribute("class", "line-segment-hotspot");
                seg.setAttribute("data-line-id", line.id);
                seg.setAttribute("data-seg-index", i);
                seg.setAttribute("stroke", "transparent");
                seg.setAttribute("stroke-width", "15");
                seg.setAttribute("fill", "none");
                seg.style.cursor = "pointer";
                seg.style.pointerEvents = "stroke";

                seg.addEventListener('click', (e) => {
                    if (window.isMapDragging) return;
                    e.stopPropagation();
                    const fromId = line.stationIds[i];
                    const toId = line.stationIds[i + 1];
                    const fromStation = stationsData[fromId];
                    const toStation = stationsData[toId];
                    if (!fromStation || !toStation) return;
                    const time = (line.segmentTimes && line.segmentTimes[i] !== undefined) ? line.segmentTimes[i] : '—';
                    const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                    window.showSegmentBubble(line, fromStation, toStation, time, midPoint);
                });

                frag.appendChild(seg);
            }
            group.appendChild(frag);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => tryInject());
    } else {
        tryInject();
    }
    window.addEventListener('cgo-city-change', () => setTimeout(() => tryInject(), 300));
})();
    // window.showSegmentBubble = function (line, fromStation, toStation, time, midPoint) {
    //     if (!line || !fromStation || !toStation || !midPoint) return;
    //     removeExistingCard('.segment-card');
    //     const content = document.getElementById('map-content');
    //     if (!content) return;
    //     const card = document.createElement('div');
    //     card.className = 'cgo-glass-card segment-card';
    //     card.style.left = midPoint.x + 'px';
    //     card.style.top = midPoint.y + 'px';
    //     card.innerHTML = `
    //         <div class="seg-bar"></div>
    //         <div class="seg-body">
    //             <div class="seg-station">${fromStation.cn}</div>
    //             <div class="seg-station-en">${fromStation.en || ''}</div>
    //             <div class="seg-arrow"><cgo-icon name="unfold"></cgo-icon></div>
    //             <div class="seg-station">${toStation.cn}</div>
    //             <div class="seg-station-en">${toStation.en || ''}</div>
    //             <div class="seg-time"><cgo-icon name="time"></cgo-icon> 约 <b>${time}</b> 分钟</div>
    //         </div>`;
    //     content.appendChild(card);
    //     setTimeout(() => {
    //         const closeHandler = (e) => {
    //             if (!card.contains(e.target)) {
    //                 card.remove();
    //                 document.removeEventListener('click', closeHandler);
    //             }
    //         };
    //         document.addEventListener('click', closeHandler);
    //     }, 0);
    // };

    (function shrinkTerminus() {
        function apply() {
            document.querySelectorAll('.station.terminus').forEach(el => {
                el.style.width = '10px';
                el.style.height = '10px';
                el.style.transform = 'translate(-50%, -50%)';
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 500));
        } else {
            setTimeout(apply, 500);
        }
        window.addEventListener('cgo-city-change', () => setTimeout(apply, 800));
    })();
})();