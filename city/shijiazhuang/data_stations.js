/**
 * CGo OpenMap - 车站数据库 (city/shijiazhuang/data_stations.js)
 * ==============================================================================
 * 字段说明：dot 普通车站 / tsf 换乘车站 / rdot 国铁火车站 / terminus 虚拟站 / scenery 景区站 / railcity 换乘城市站 / via 走向辅助站
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * 在石家庄地铁官网不出来能用的线路信息前，暂时不使用线路内容。
 */


const stationsData = {
    // ========== 1号线 ==========
    "M100": { type: "terminus", x: 200, y: 1000, cn: "1号线 Line 1", en: "首班车 06:30 发出", align: "left", offset: { x: -10, y: 0 }, textScale: { cn: 0.8, en: 0.9 }, lineInfo: { lineId: "M1", from: "西王", to: "福泽", firstTrain: "06:30", lastTrain: "22:30", website: "预留网址" } },
    "M101": { type: "dot", x: 240, y: 1000, cn: "西王", en: "XI WANG", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M102": { type: "dot", x: 360, y: 1000, cn: "时光街", en: "SHI GUANG JIE", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M103": { type: "dot", x: 480, y: 1000, cn: "长城桥", en: "CHANG CHENG QIAO", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M104": { type: "dot", x: 600, y: 1000, cn: "和平医院", en: "HE PING YI YUAN", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M105": { type: "dot", x: 720, y: 1000, cn: "烈士陵园", en: "LIE SHI LING YUAN", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M106": { type: "tsf", x: 840, y: 1000, cn: "新百广场", en: "XIN BAI GUANG CHANG", align: "bottom-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M107": { type: "dot", x: 960, y: 1000, cn: "解放广场", en: "JIE FANG GUANG CHANG", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M108": { type: "dot", x: 1080, y: 1000, cn: "平安大街", en: "PING AN DA JIE", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M109": { type: "tsf", x: 1200, y: 1000, cn: "北国商城", en: "BEI GUO SHANG CHENG", align: "top-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M110": { type: "dot", x: 1320, y: 1000, cn: "博物院", en: "BO WU YUAN", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M111": { type: "dot", x: 1440, y: 1000, cn: "体育场", en: "TI YU CHANG", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M112": { type: "dot", x: 1560, y: 1000, cn: "北宋", en: "BEI SONG", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M113": { type: "dot", x: 1680, y: 1000, cn: "谈固", en: "TAN GU", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M114": { type: "dot", x: 1800, y: 1000, cn: "朝晖桥", en: "ZHAO HUI QIAO", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M115": { type: "dot", x: 1920, y: 1000, cn: "白佛", en: "BAI FO", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M116": { type: "dot", x: 2040, y: 1000, cn: "留村", en: "LIU CUN", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M117": { type: "dot", x: 2160, y: 1000, cn: "火炬广场", en: "HUO JU GUANG CHANG", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M117B": { type: "via", x: 2190, y: 1000, cn: "", en: "", hideMarker: true, hideLabel: true },
    "M118": { type: "dot", x: 2190, y: 940, cn: "石家庄东站", en: "SHI JIA ZHUANG DONG ZHAN", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    // "R_SJZD": { type: "rdot", x: 2310, y: 940, cn: "石家庄东站", en: "Shijiazhuangdong Railway Station", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 }, railways: ["石济高速铁路"] },
    "M119": { type: "dot", x: 2190, y: 880, cn: "南村", en: "NAN CUN", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M120": { type: "dot", x: 2190, y: 760, cn: "洨河大道", en: "XIAO HE DA DAO", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M121": { type: "dot", x: 2190, y: 640, cn: "西庄", en: "XI ZHUANG", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M122": { type: "dot", x: 2190, y: 520, cn: "东庄", en: "DONG ZHUANG", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M123": { type: "dot", x: 2190, y: 400, cn: "会展中心", en: "HUI ZHAN ZHONG XIN", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M124": { type: "dot", x: 2190, y: 280, cn: "商务中心", en: "SHANG WU ZHONG XIN", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M125": { type: "dot", x: 2190, y: 160, cn: "园博园", en: "YUAN BO YUAN", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M126": { type: "dot", x: 2190, y: 40, cn: "福泽", en: "FU ZE", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M1000": { type: "terminus", x: 2190, y: 20, cn: "1号线 Line 1", en: "首班车 06:30 发出", align: "top", offset: { x: 0, y: -10 }, textScale: { cn: 0.8, en: 0.9 }, lineInfo: { lineId: "M1", from: "西王", to: "福泽", firstTrain: "06:30", lastTrain: "22:30", website: "预留网址" } },

    // ========== 2号线 ==========
    "M200": { type: "terminus", x: 1200, y: 280, cn: "2号线 Line 2", en: "首班车 06:30 发出", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 0.8, en: 0.9 }, lineInfo: { lineId: "M2", from: "柳辛庄", to: "嘉华路", firstTrain: "06:30", lastTrain: "22:30", website: "预留网址" } },
    "M201": { type: "dot", x: 1200, y: 400, cn: "柳辛庄", en: "LIU XIN ZHUANG", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M202": { type: "dot", x: 1200, y: 520, cn: "庄窠·铁道大学", en: "ZHUANG KE", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M203": { type: "dot", x: 1200, y: 640, cn: "义堂", en: "YI TANG", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M204": { type: "dot", x: 1200, y: 760, cn: "建和桥", en: "JIAN HE QIAO", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M205": { type: "dot", x: 1200, y: 880, cn: "长安公园", en: "CHANG AN GONG YUAN", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M206": { type: "dot", x: 1200, y: 1120, cn: "裕华路", en: "YU HUA LU", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M207": { type: "dot", x: 1200, y: 1240, cn: "槐中路", en: "HUAI ZHONG LU", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M208": { type: "dot", x: 1200, y: 1360, cn: "欧韵公园", en: "OU YUN GONG YUAN", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M209": { type: "dot", x: 1020, y: 1480, cn: "元村", en: "YUAN CUN", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M210": { type: "tsf", x: 850, y: 1600, cn: "石家庄站", en: "SHI JIA ZHUANG ZHAN", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 }, isRailway: true },
    // "R_SJZ": { type: "rdot", x: 700, y: 1600, cn: "石家庄站", en: "Shijiazhuang Railway Station", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0,en: 1.0 }, railways: ["京广铁路", "京广高速铁路", "石济高速铁路", "石太高速铁路"] },
    "M211": { type: "dot", x: 850, y: 1660, cn: "塔坛", en: "TA TAN", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M212": { type: "dot", x: 850, y: 1720, cn: "塔坛", en: "TA TAN", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M213": { type: "dot", x: 850, y: 1780, cn: "南位", en: "NAN WEI", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M214": { type: "dot", x: 850, y: 1840, cn: "嘉华路", en: "JIA HUA LU", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M2000": { type: "terminus", x: 850, y: 1900, cn: "2号线 Line 2", en: "首班车 06:30 发出", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 0.8, en: 0.9 }, lineInfo: { lineId: "M2", from: "柳辛庄", to: "嘉华路", firstTrain: "06:30", lastTrain: "22:30", website: "预留网址" } },

    // ========== 3号线 ==========
    "M300":  { type: "terminus", x: 680, y: 400, cn: "3号线 Line 3", en: "首班车 06:30 发出", align: "left", offset: { x: -10, y: 0 }, textScale: { cn: 0.8, en: 0.9 }, lineInfo: { lineId: "M3", from: "西三庄", to: "乐乡", firstTrain: "06:30", lastTrain: "22:30", website: "预留网址" } },
    "M301":  { type: "dot", x: 720, y: 400, cn: "西三庄", en: "XI SAN ZHUANG", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M302":  { type: "dot", x: 820, y: 400, cn: "高柱", en: "GAO ZHU", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M303":  { type: "dot", x: 840, y: 520, cn: "柏林庄", en: "BO LIN ZHUANG", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M304":  { type: "dot", x: 840, y: 640, cn: "市庄", en: "SHI ZHUANG", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M305":  { type: "dot", x: 840, y: 760, cn: "市二中", en: "SHI ER ZHONG", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M306":  { type: "dot", x: 840, y: 1120, cn: "东里", en: "DONG LI", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M307":  { type: "dot", x: 840, y: 1240, cn: "槐安桥", en: "HUAI AN QIAO", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M308":  { type: "dot", x: 840, y: 1380, cn: "西三教", en: "XI SAN JIAO", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M309":  { type: "dot", x: 1080, y: 1600, cn: "汇通路", en: "HUI TONG LU", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M310":  { type: "dot", x: 1200, y: 1600, cn: "孙村", en: "SUN CUN", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M311":  { type: "dot", x: 1320, y: 1600, cn: "塔冢", en: "TA ZHONG", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M312":  { type: "dot", x: 1440, y: 1600, cn: "东王", en: "DONG WANG", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M313":  { type: "dot", x: 1560, y: 1600, cn: "南王", en: "NAN WANG", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M314":  { type: "dot", x: 1680, y: 1600, cn: "位同", en: "WEI TONG", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M315":  { type: "dot", x: 1760, y: 1600, cn: "东二环南路", en: "DONG ER HUAN NAN LU", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M316":  { type: "dot", x: 1840, y: 1600, cn: "西仰陵", en: "XI YANG LING", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M316B": { type: "dot", x: 1920, y: 1600, cn: "中仰陵", en: "ZHONG YANG LING", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M317":  { type: "dot", x: 2000, y: 1600, cn: "南豆", en: "NAN DOU", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M318":  { type: "dot", x: 2080, y: 1600, cn: "太行南大街", en: "TAI HANG NAN DA JIE", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M319":  { type: "dot", x: 2160, y: 1600, cn: "乐乡", en: "LE XIANG", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M3000": { type: "terminus", x: 2200, y: 1600, cn: "3号线 Line 3", en: "首班车 06:30 发出", align: "right", offset: { x: 10, y: 0 }, textScale: { cn: 0.8, en: 0.9 }, lineInfo: { lineId: "M3", from: "西三庄", to: "乐乡", firstTrain: "06:30", lastTrain: "22:30", website: "预留网址" } },

    // ========== 景区站 ==========
    "S_YUXI":      { type: "scenery", x: 240,  y: 1040,  cn: "裕西公园", en: "YUXI PARK", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "裕西公园位于河北省石家庄市桥西区中山西路698号，东临苑东街，南靠裕华西路，占地401亩，其中水域面积90余亩，绿化覆盖率达90%以上。其前身为石家庄动物园旧址，2006年启动改造工程，拆除兽舍及围墙，保留桥廊建筑并新建青石铺装南门广场，增设环湖灯光系统及游船设施，同年5月对外开放。公园分为名人雕塑区、竹园区、水上休闲区等九大功能区，西北部建有江南庭院风格的“众春天香”景区，种植十二月时序花卉，东侧“冀域风情景区”展示常山战鼓、蔚县剪纸等河北民俗文化。沉绿湖经驳岸改造后水位提升，增设临水木栈道及梨花伴月景区，北门建有跨度25.95米的六柱五跨古典牌楼，为河北省最大冲天式牌楼。2023年，公园新增文化休闲园，包含文化展示、亲子体验等复合功能。", website: "https://baike.baidu.com/item/%E8%A3%95%E8%A5%BF%E5%85%AC%E5%9B%AD", badge: "那么近那么美周末到河北" },
    "S_CHANGAN":   { type: "scenery", x: 1220, y: 820,   cn: "长安公园", en: "CHANG'AN PARK", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "长安公园位于石家庄市中山东路205号，是隶属于石家庄市园林局的全民所有制事业单位，是省会大型的综合性公园，也是石家庄市区重要的旅游景点。该公园始建于1955年5月，1958年8月1日正式开放，取名“解放公园”。1960年改名为“长安公园”，1968年长安区改名为“东方红区”，公园随着改名为“东方红公园”。1980年恢复“长安公园”。该公园有东、西、南三个出入口，全园占地363.5亩，其中水面90亩，各种划船、脚踏船、造型船120余只，各种花卉树木200余个品种7.8万余株，绿地面积199799平方米，绿地率达88.8%。公园规划北部为文化区，设有“老干部活动厅”、“观赏温室”、“鹿泉小景”等，东部为娱乐区，设有大型观览车、碰碰车等游艺设施：中心地带建有“清滢楼”茶社建筑群。1999年公园被列入全国百家名园之一。2000年2月5日公园免费向游人开放。", website: "https://baike.baidu.com/item/%E9%95%BF%E5%AE%89%E5%85%AC%E5%9B%AD/13579314", badge: "那么近那么美周末到河北" },
    "S_YUANBO":    { type: "scenery", x: 2170, y: 160,   cn: "河北正定园博园", en: "YUANBO GARDEN", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "河北省园博园位于河北省石家庄市正定新区新城大街，南距滹沱河3.2公里，西距正定县城1.5公里，占地约1200亩。2012年4月28日建成开放并承办由河北省人民政府主办、石家庄市人民政府与河北省住房和城乡建设厅共同承办的河北省第一届园林博览会。2023年获评国家AAA级旅游景区，2015年被评为河北省五星级公园，2023年5月15日起实行免费入园政策。为满足园博会办展需要，园区划分为主入口广场、燕赵园、社会园、专类园、康体园、滨水景观区、山体休闲区七大功能分区。燕赵园汇集河北省11个地市展园，包含石家庄园“西柏坡”、邯郸园“胡服骑射”等特色景观。主展馆采用钻石造型，建筑面积2万平方米，配套人工湖及128米长音乐喷泉。滨水区建有瀑布、浮岛等设施，康体园配备多项体育场地。", website: "https://baike.baidu.com/item/%E6%B2%B3%E5%8C%97%E7%9C%81%E5%9B%AD%E5%8D%9A%E5%9B%AD", badge: "那么近那么美周末到河北" },
    "S_OUYUN":     { type: "scenery", x: 1200, y: 1420,  cn: "欧韵公园", en: "OUYUN PARK", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "欧韵公园位于石家庄市裕华区建设南大街南端西侧，占地面积5.13公顷，1999年10月建成开放。公园采用欧洲古典园林造园手法，以中轴对称布局为核心特征，主要景观包括柱廊广场、镜水庭院和喷泉水池等欧式建筑群。2022年实施海绵城市提升改造工程，增设透水铺装与下沉式绿地等设施优化排水系统。", website: "https://baike.baidu.com/item/%E6%AC%A7%E9%9F%B5%E5%85%AC%E5%9B%AD", badge: "那么近那么美周末到河北" },
    "S_SHANSHUI":  { type: "scenery", x: 840,  y: 360,   cn: "水上公园", en: "SHUISHANG PARK", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "石家庄市水上公园，位于友谊北大街以东、联盟路以南，占地38公顷。水上公园建设项目是市委、市政府确定向党的十五大和石家庄解放五十周年献礼的项目，市政府投资13658万元，由中外园林建设总公司北京设计分公司设计，于1997年5月开工建设，1998年9月30日完工，1998年10月1日建成开放。", website: "https://baike.baidu.com/item/%E7%9F%B3%E5%AE%B6%E5%BA%84%E5%B8%82%E6%B0%B4%E4%B8%8A%E5%85%AC%E5%9B%AD", badge: "那么近那么美周末到河北" },
    "S_SHIJI":     { type: "scenery", x: 1440, y: 1540,  cn: "世纪公园", en: "SHIJI PARK", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "石家庄世纪公园是位于市区东南部的大型综合性公园，总占地面积24.67公顷，2001年5月1日初步开放。公园以民心河穿园而过的80亩湖面为核心，划分为广场景观区、体育活动区等五大功能分区。设计融合东西方园林艺术，突出人与自然和谐共处理念，园内设有280米高的石家庄电视塔地标建筑。作为免费开放场所，夜间设有LED节能照明系统和互动投影装置，夏季可观赏荷花景观。", website: "https://baike.baidu.com/item/%E4%B8%96%E7%BA%AA%E5%85%AC%E5%9B%AD/3515928", badge: "那么近那么美周末到河北" },
    "S_BOWUYUAN":  { type: "scenery", x: 1320, y: 940,   cn: "河北博物院", en: "HEBEI MUSEUM", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "馆舍包括主院区、建华院区、育才院区、西大街院区四部分，占地面积8.5万平方米，总建筑面积6.7万平方米，展陈面积2.1万平方米。截至2025年12月，现有藏品总数34万余件，其中珍贵文物4.9万余件。主院区设“战国雄风——古中山国”“大汉绝唱——满城汉墓”“慷慨悲歌——燕赵故事”“曲阳石雕”“北朝壁画”“名窑名瓷”“石器时代的河北”“河北商代文明”“抗日烽火 英雄河北”“河北省非物质文化遗产保护成果展”等10个常设陈列，通过5000余件套精美的文物和现代化展示手段，系统呈现了河北百万年的人类史、一万年的文化史、五千多年的文明史。", website: "https://baike.baidu.com/item/%E6%B2%B3%E5%8C%97%E5%8D%9A%E7%89%A9%E9%99%A2", badge: "那么近那么美周末到河北" },
    "S_HUITONG":   { type: "scenery", x: 1080, y: 1540,  cn: "中央绿色体育公园", en: "CENTRAL GREEN PARK", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "中央绿色体育公园西至京广东街，东至汇通路，北至塔南路，南至汇华路，由东向西分为生态健身运动区、活力竞技运动区、特色主题运动区、运动文化展示区四个区域，规划总占地面积约28.84万平方米，总绿地面积达17万平方米，绿地率近60％。园区体育元素丰富，有足、篮、排、网球、乒乓球、门球、儿童运动场等各类运动场地以及网球馆、乒乓球馆、多功能体育馆、健身俱乐部等场馆4座，同时还建有多个健身广场、健身步道等。", website: "https://baike.baidu.com/item/%E4%B8%AD%E5%A4%AE%E7%BB%BF%E8%89%B2%E4%BD%93%E8%82%B2%E5%85%AC%E5%9B%AD", badge: "那么近那么美周末到河北" },
    "S_TAZHONG":   { type: "scenery", x: 1320, y: 1540,  cn: "富强公园", en: "FUQIANG PARK", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 }, intro: "石家庄富强公园位于富强大街南端东侧，塔北路北侧，民心河畔，占地面积2.8公顷，绿地率67%。该公园始建于1999年6月25日，同年10月建成开放，是石家庄市园林局直接管理的市属公园。园内以曲线形主路串联入口区、儿童活动区、中心广场区、下沉广场区及雕塑观赏区，配有游乐设施、乒乓球台和健身器材，种植竹林、樱花、海棠等植被。2020年，该公园被打造为石家庄市首座消防主题公园，园内设有电子宣传屏、消防文化长廊、消防安全知识展牌及儿童消防涂鸦区、模拟逃生长廊、消防常识普及区、消防装备展示区等功能区域。2022年启动提升改造工程，改造内容包括更新老旧设施、增设健身步道、优化门区景观，并对植物配置进行更新调整。", website: "https://baike.baidu.com/item/%E7%9F%B3%E5%AE%B6%E5%BA%84%E5%AF%8C%E5%BC%BA%E5%85%AC%E5%9B%AD/5026840", badge: "那么近那么美周末到河北" },

    // ========== 换乘城市站 ==========
    "C_BEIJING":   { type: "railcity", x: 600,  y: 1700, cn: "北京", en: "BEIJING [石家庄站可达]", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 }, website: "https://centralgo.site/dev/openmap/main.html?city=beijing" },
    "C_QINGDAO":   { type: "railcity", x: 1080, y: 1700, cn: "青岛", en: "QINGDAO[石家庄站可达]", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 }, website: "https://centralgo.site/dev/openmap/main.html?city=qingdao" }
};