/**
 * CGo OpenMap - 车站数据库 (city/lanzhou/data_stations.js)
 * 
 * ==============================================================================
 * 车站数据结构规范与字段说明 (Station Schema & Field Specifications)
 * ==============================================================================
 * 键名 (Key): 车站唯一标识符 Station ID (推荐格式："M{线路号}{车站序号}"，如 "M101", "M201")
 * 
 * 字段说明：
 * - type {string} (必填) 车站渲染图标类型：
 *     - "dot"  : 普通车站 (随线路主题色着色的标准圆环)
 *     - "tsf"  : 换乘车站 (黑白双环+换乘箭头标志)
 *     - "tsfo" : 出站虚拟换乘/特殊换乘车站
 *     - "no"   : 暂缓开通/在建车站 (灰色斜纹图案)
 *     - "rdot" : 国铁火车站/市郊铁路站点 (深灰色核心)
 * - x {number} (必填) 车站中心点在画布上的 X 轴像素坐标
 * - y {number} (必填) 车站中心点在画布上的 Y 轴像素坐标
 * - cn {string} (必填) 中文站名 (例如 "西直门")
 * - en {string} (必填) 英文站名 (例如 "Xizhimen"，支持使用 `<br>` 进行两行断句折行)
 * - align {string} (必填) 站名文本相对于车站圆点的锚点方向：
 *     - "top" | "bottom" | "left" | "right"
 *     - "top-left" | "top-right" | "bottom-left" | "bottom-right"
 * - offset {Object} (可选) 文本微调位移 { x: px, y: px }，默认 { x: 0, y: 0 }
 * - textScale {Object} (可选) 字体拉伸缩放比 { cn: 1.0, en: 1.0 }，常用于长站名微缩避让
 * - hideLabel {boolean} (可选) 是否隐藏文字标签（仅保留站点圆点，如分叉辅助点）
 * - badge {string} (可选) 车站文化特色徽标图标相对路径
 * 
 * ️ 移植小贴士 (Porting Tip):
 * 换乘站在多条线路穿过时只需定义一个 Station ID，或在不同线路定义不同 ID 但保持相同的 x, y 坐标，
 * 核心引擎 (core/script.js) 会自动识别物理坐标重合的站点并完成多线换乘归并。
 * ==============================================================================
 */

// 坐标系说明：本文件中的 x / y 已是画布最终坐标
// （RMP 源数据的站点与虚拟节点统一 +500 / +800 后的结果）。
// ⚠️ 严禁在本文件末尾再追加任何运行期整体平移：源码字面量必须与实际数据逐字段一致，
//    否则 Drunk 编辑模式的「条目级无损回写」会把已平移的值再平移一次，
//    每保存一次，全城站点就整体漂移 (+500, +800)。

const stationsData = {
    "M126": { type: "no", x: 210, y: 1300, cn: "化工街", en: "Huagongjie", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M125": { type: "no", x: 255, y: 1300, cn: "西柳沟", en: "Xiliugou", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M124": { type: "no", x: 305, y: 1300, cn: "清水桥", en: "Qingshui Bridge", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M123": { type: "no", x: 355, y: 1300, cn: "玉门街", en: "Yumenjie", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M122": { type: "no", x: 410, y: 1300, cn: "金城中心", en: "Jincheng Center", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M121": { type: "no", x: 465, y: 1300, cn: "西固东路", en: "Xigu East Road", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M120": { type: "dot", x: 520, y: 1300, cn: "陈官营", en: "Chenguanying", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M119": { type: "dot", x: 600, y: 1260, cn: "奥体中心", en: "Olympic Center", align: "top-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M118": { type: "tsf", x: 680, y: 1221, cn: "兰州城市学院（省科技馆）", en: "Lanzhou City University (Gansu Science & Technology Museum)", align: "top", offset: { x: 0, y: -5 }, textScale: { cn: 0.9, en: 0.9 } },
    "M117": { type: "dot", x: 740, y: 1225, cn: "兰州海关", en: "Lanzhou Customs", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M116": { type: "dot", x: 820, y: 1260, cn: "马滩", en: "Matan", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M115": { type: "dot", x: 900, y: 1300, cn: "土门墩", en: "Tumendun", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },    
    "M114": { type: "tsf", x: 1000, y: 1300, cn: "兰州西站北广场", en: "North Square of Lanzhou West Railway Station", align: "top", offset: { x: 0, y: -5 }, textScale: { cn: 0.9, en: 0.9 } },
    "M113": { type: "dot", x: 1100, y: 1300, cn: "西站什字", en: "Xizhanshizi", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M112": { type: "dot", x: 1160, y: 1300, cn: "七里河", en: "Qilihe", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M111": { type: "dot", x: 1220, y: 1300, cn: "小西湖", en: "Xiaoxihu Park", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M110": { type: "dot", x: 1280, y: 1300, cn: "文化宫", en: "Cultural Palace", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M109": { type: "tsf", x: 1344, y: 1300, cn: "西关", en: "Xiguan", align: "bottom-left", offset: { x: -5, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M108": { type: "dot", x: 1400, y: 1300, cn: "省政府", en: "Gansu Provincial Government", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M107": { type: "tsf", x: 1490, y: 1349, cn: "东方红广场", en: "Dongfanghong Square", align: "bottom", offset: { x: 0, y: 5 }, textScale: { cn: 1.0, en: 1.0 } },
    "M106": { type: "tsf", x: 1610, y: 1345, cn: "兰州大学", en: "Lanzhou University", align: "top-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M105": { type: "tsf", x: 1710, y: 1345, cn: "五里铺", en: "Wulipu", align: "bottom-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M104": { type: "dot", x: 1800, y: 1345, cn: "省气象局", en: "Meteorological Bureau", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M103": { type: "dot", x: 1870, y: 1345, cn: "拱星墩", en: "Gongxingdun", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M102": { type: "dot", x: 1940, y: 1345, cn: "焦家湾", en: "Jiaojiawan", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M101": { type: "tsf", x: 2010, y: 1341, cn: "东岗", en: "Donggang", align: "bottom", offset: { x: 0, y: 5 }, textScale: { cn: 1.0, en: 1.0 } },

    "M201": { type: "tsf", x: 1710, y: 1195, cn: "雁白大桥", en: "Yanbai Bridge", align: "top", offset: { x: 0, y: -5 }, textScale: { cn: 1.0, en: 1.0 } },
    "M202": { type: "tsf", x: 1710, y: 1245, cn: "均家滩", en: "Junjiatan", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M203": { type: "dot", x: 1710, y: 1295, cn: "张苏滩", en: "Zhangsutan", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M205": { type: "dot", x: 1710, y: 1390, cn: "团结新村", en: "Tuanjie Xincun", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M206": { type: "dot", x: 1670, y: 1430, cn: "红星巷", en: "Hongxingxiang", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M207": { type: "tsf", x: 1610, y: 1434, cn: "兰州火车站", en: "Lanzhou Railway Station", align: "bottom", offset: { x: 0, y: 5 }, textScale: { cn: 1.0, en: 1.0 } },
    "M208": { type: "dot", x: 1550, y: 1390, cn: "邮电大楼", en: "Youdiandalou", align: "bottom-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M210": { type: "no", x: 1400, y: 1353, cn: "南关", en: "Nanguan", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M211": { type: "no", x: 1340, y: 1353, cn: "双城门", en: "Shuangchengmen", align: "bottom-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M212": { type: "no", x: 1280, y: 1353, cn: "孙家台", en: "Sunjiatai", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M213": { type: "no", x: 1220, y: 1353, cn: "上西园", en: "Shangxiyuan", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M214": { type: "no", x: 1160, y: 1353, cn: "兰理工兰工坪", en: "Lanzhou University of Technology<br>Langongping Campus", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 } },
    "M215": { type: "no", x: 1100, y: 1353, cn: "武威路", en: "Wuwei Road", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M216": { type: "no", x: 1000, y: 1330, cn: "兰州西站南广场", en: "South Square of Lanzhou West Railway Station", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 } },
    "M218": { type: "no", x: 1000, y: 1245, cn: "火星街", en: "Huoxingjie", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M219": { type: "no", x: 1000, y: 1180, cn: "十里店", en: "Shilidian", align: "top", offset: { x: 0, y: -5 }, textScale: { cn: 1.0, en: 1.0 } },

    "M220": { type: "no", x: 970, y: 1390, cn: "龚家坪", en: "Gongjiaping", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M221": { type: "no", x: 940, y: 1420, cn: "兰理工彭家坪", en: "Lanzhou Univeristy of Technology<br>Pengjiaping Campus", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M222": { type: "no", x: 880, y: 1420, cn: "彭家坪", en: "Pengjiaping", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M223": { type: "no", x: 820, y: 1420, cn: "蒋家坪", en: "Jiangjiaping", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M224": { type: "no", x: 760, y: 1420, cn: "牟家坪", en: "Moujiaping", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

    "M702": { type: "no", x: 1530, y: 1439, cn: "铁路新村", en: "Tielu Xincun", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M703": { type: "no", x: 1460, y: 1439, cn: "五泉广场", en: "Wuquan Square", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M704": { type: "no", x: 1390, y: 1420, cn: "中山林", en: "Zhongshanlin", align: "bottom-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M705": { type: "no", x: 1360, y: 1390, cn: "安定门", en: "Andingmen", align: "bottom-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M708": { type: "no", x: 1310, y: 1245, cn: "中山桥", en: "Zhongshan Bridge", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M709": { type: "no", x: 1240, y: 1245, cn: "黄河母亲", en: "Yellow River Mother Sculpture", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M710": { type: "no", x: 1140, y: 1180, cn: "北滨河中路", en: "Beibinhe Middle Road", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M711": { type: "no", x: 1070, y: 1180, cn: "洄水湾", en: "Huishuiwan", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M713": { type: "no", x: 940, y: 1180, cn: "培黎广场", en: "Peili Square", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M714": { type: "no", x: 880, y: 1180, cn: "西北师范大学", en: "Northwest Normal University", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M715": { type: "no", x: 820, y: 1180, cn: "兰州交通大学", en: "Lanzhou Jiaotong University", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 0.9, en: 0.9 } },
    "M716": { type: "no", x: 760, y: 1180, cn: "桃海市场", en: "Taohai Market", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M718": { type: "no", x: 650, y: 1150, cn: "刘家堡", en: "Liujiapu", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M719": { type: "no", x: 650, y: 1090, cn: "兰州植物园", en: "Lanzhou Botanical Garden", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M720": { type: "no", x: 980, y: 960, cn: "青年街", en: "Qingnianjie", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M721": { type: "no", x: 980, y: 900, cn: "文景街", en: "Wenjingjie", align: "top-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M722": { type: "no", x: 980, y: 840, cn: "北山路", en: "Beishan Road", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M723": { type: "no", x: 920, y: 800, cn: "朱家大坪", en: "Zhujiadaping", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M724": { type: "no", x: 860, y: 800, cn: "朱家井", en: "Zhujiajing", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M725": { type: "no", x: 800, y: 770, cn: "三坪", en: "Sanping", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M726": { type: "no", x: 800, y: 730, cn: "经开", en: "Jingkai", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M727": { type: "no", x: 800, y: 690, cn: "经开北", en: "Jingkai North", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

    "M302": { type: "no", x: 1390, y: 1210, cn: "庙滩子", en: "Miaotanzi", align: "top-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M303": { type: "no", x: 1490, y: 1195, cn: "草场街", en: "Caochangjie", align: "top-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M304": { type: "no", x: 1550, y: 1195, cn: "盐场堡", en: "Yanchangpu", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M305": { type: "no", x: 1610, y: 1195, cn: "黄河大桥", en: "Huanghe Great Bridge", align: "top-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M307": { type: "no", x: 1800, y: 1195, cn: "兰州文理学院", en: "Lanzhou University of Arts and Science", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M308": { type: "no", x: 1840, y: 1150, cn: "白道坪", en: "Baidaoping", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M309": { type: "no", x: 1840, y: 1110, cn: "碧桂园", en: "Biguiyuan", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M310": { type: "no", x: 1840, y: 1070, cn: "诺丁山", en: "Nuodingshan", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M311": { type: "no", x: 1840, y: 1030, cn: "朱雀路", en: "Zhuque Road", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M312": { type: "no", x: 1840, y: 990, cn: "陆家沟", en: "Lujiagou", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M313": { type: "no", x: 1800, y: 950, cn: "黄河新城", en: "Yellow River New City", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M314": { type: "no", x: 1715, y: 950, cn: "水源东", en: "Shuiyuan East", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M315": { type: "no", x: 1610, y: 950, cn: "万福城东", en: "Wanfucheng East", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M316": { type: "no", x: 1550, y: 950, cn: "万福城", en: "Wanfucheng", align: "down", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M317": { type: "no", x: 1520, y: 910, cn: "玄武路", en: "Xuanwu Road", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M318": { type: "no", x: 1520, y: 870, cn: "科学城", en: "Science City", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

    "M401": { type: "no", x: 1490, y: 1245, cn: "市民公园", en: "Citizens' Park", align: "left", offset: { x: -5, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M402": { type: "no", x: 1550, y: 1245, cn: "雁滩公园", en: "Yantan Park", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M403": { type: "no", x: 1610, y: 1245, cn: "滩尖子", en: "Tanjianzi", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M404": { type: "no", x: 1660, y: 1245, cn: "雁滩什字", en: "Yantan Shizi", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M406": { type: "no", x: 1800, y: 1245, cn: "雁兴路", en: "Yanxing Road", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M407": { type: "no", x: 1855, y: 1270, cn: "雁东街", en: "Yandongjie", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M408": { type: "no", x: 1910, y: 1295, cn: "范家湾", en: "Fanjiawan", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M410": { type: "no", x: 2080, y: 1380, cn: "和平", en: "Heping", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M411": { type: "no", x: 2110, y: 1410, cn: "和平东", en: "Heping East", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M412": { type: "no", x: 2140, y: 1440, cn: "定远西", en: "Dingyuan West", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M413": { type: "no", x: 2170, y: 1470, cn: "定远", en: "Dingyuan", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M414": { type: "no", x: 2200, y: 1500, cn: "科技新城", en: "New Town of Technology and Science", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M415": { type: "no", x: 2230, y: 1530, cn: "榆中西", en: "Yuzhong West", align: "bottom-left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M416": { type: "no", x: 2280, y: 1550, cn: "榆中", en: "Yuzhong", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M417": { type: "no", x: 2330, y: 1530, cn: "榆中东", en: "Yuzhong East", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M418": { type: "no", x: 2360, y: 1500, cn: "三角城", en: "Sanjiaocheng", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M419": { type: "no", x: 2390, y: 1470, cn: "生态创新城", en: "Ecological and Innovative Town", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M420": { type: "no", x: 2420, y: 1440, cn: "大学城", en: "University Town", align: "bottom-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

    "M804": { type: "no", x: 1460, y: 1130, cn: "大沙坪", en: "Dashaping", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M805": { type: "no", x: 1430, y: 1100, cn: "五一山", en: "Wuyishan", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M806": { type: "no", x: 1400, y: 1070, cn: "三湾路", en: "Sanwan Road", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M807": { type: "no", x: 1370, y: 1040, cn: "北环路", en: "Beihuan Road", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M808": { type: "no", x: 1340, y: 1010, cn: "西台路", en: "Xitai Road", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M809": { type: "no", x: 1310, y: 980, cn: "九州东坪", en: "Jiuzhoudongping", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M810": { type: "no", x: 1280, y: 950, cn: "兰州北站", en: "Lanzhou North Railway Station", align: "top-right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M811": { type: "no", x: 1250, y: 900, cn: "庙儿岔", en: "Miaoercha", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M812": { type: "no", x: 1250, y: 860, cn: "抱龙山", en: "Baolongshan", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M813": { type: "no", x: 1210, y: 830, cn: "九州北", en: "Jiuzhou North", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M814": { type: "no", x: 1140, y: 830, cn: "盐池东", en: "Yanchi East", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M815": { type: "no", x: 1100, y: 860, cn: "东沟", en: "Donggou", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M816": { type: "no", x: 1050, y: 900, cn: "西沟", en: "Xigou", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M818": { type: "no", x: 910, y: 900, cn: "保和路", en: "Baohe Road", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

    "M506": { type: "no", x: 1610, y: 800, cn: "傅家窑", en: "Fujiayao", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M507": { type: "no", x: 1610, y: 690, cn: "水阜", en: "Shuifu", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M508": { type: "no", x: 1200, y: 600, cn: "沙岗", en: "Shagang", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M509": { type: "no", x: 900, y: 600, cn: "颜家沟", en: "Yanjiagou", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M510": { type: "no", x: 630, y: 525, cn: "秦王川站", en: "Qinwangchuan Railway Station", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M511": { type: "no", x: 540, y: 400, cn: "科东路", en: "Kedong Road", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M512": { type: "no", x: 460, y: 400, cn: "终南山路", en: "Zhongnanshan Road", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M513": { type: "no", x: 380, y: 400, cn: "贵清山路", en: "Guiqingshan Road", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M514": { type: "no", x: 300, y: 400, cn: "鸣沙山路", en: "Mingshashan Road", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M515": { type: "no", x: 250, y: 340, cn: "中川机场4号航站楼", en: "Terminal 4 of Zhongchuan International Airport", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M516": { type: "no", x: 250, y: 280, cn: "中川机场3号航站楼", en: "Terminal 3 of Zhongchuan International Airport", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

    "M517": { type: "no", x: 630, y: 350, cn: "纬八路", en: "Latitudinal 8th Rd.", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M518": { type: "no", x: 630, y: 310, cn: "纬十四路", en: "Latitudinal 14th Rd.", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M519": { type: "no", x: 630, y: 270, cn: "长江大道", en: "Changjiang Avenue", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M520": { type: "no", x: 630, y: 230, cn: "职教园南", en: "Zhijiaoyuan South", align: "right", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "M521": { type: "no", x: 560, y: 200, cn: "职教园西", en: "Zhijiaoyuan West", align: "top", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

    "S101": { type: "rdot", x: 1610, y: 1475, cn: "兰州", en: "Lanzhou", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "S102": { type: "rdot", x: 985, y: 1315, cn: "兰州西", en: "Lanzhouxi", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "S103": { type: "rdot", x: 520, y: 1315, cn: "陈官营", en: "Chenguanying", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "S104": { type: "rdot", x: 355, y: 1315, cn: "福利区", en: "Fuliqu", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "S105": { type: "rdot", x: 230, y: 1315, cn: "西固", en: "Xigu", align: "bottom", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "S106": { type: "rdot", x: 140, y: 440, cn: "兰州新区", en: "Lanzhouxinqu", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },
    "S107": { type: "rdot", x: 235, y: 280, cn: "中川机场东", en: "Zhongchuanjichangdong", align: "left", offset: { x: 0, y: 0 }, textScale: { cn: 1.0, en: 1.0 } },

};

// 注：上表坐标已是画布最终坐标，无需任何运行期平移（见文件头坐标系说明）。