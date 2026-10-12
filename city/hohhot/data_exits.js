/**
 * CGo OpenMap - hohhot车站出入口数据
 *
 * ⚠️ 本文件由脚本生成，请勿手工编辑。生成脚本是维护者本地的开发期离线工具
 *   （不进运行时、也不入版本库，用完即删）：drunk/tools/facilities/ 下一次性的维基抓取 / 写回脚本。
 *
 * 数据来源：中文维基百科各车站条目的「车站出口」章节（人工核定的出口编号与目的地），
 *   数据著作权归维基百科贡献者所有（CC BY-SA），展示时应注明来源。
 *
 * 结构：本地车站 ID -> 出口数组；
 *   name      出口编号（不含「口」字）
 *   lines     该出口所属线路
 *   desc      出口指示（维基「地点 / 出口指示」列原文）
 *   landmarks 建议前往的目的地（维基「可到达目的地」列原文）
 * 维基不给出入口经纬度，故不写 pos —— 出入口小地图因此不给本城标点。
 *
 * 生成时间：2026-10-07
 */
const HOHHOT_STATION_EXITS = {
    "M101": [
        { name: "A", lines: ["1号线"], desc: "三间房车辆基地北", landmarks: ["达尔架大东营村"] },
        { name: "B", lines: ["1号线"], desc: "三间房车辆基地南", landmarks: ["三间房村"] },
    ],
    "M102": [
        { name: "B", lines: ["1号线"], desc: "新华西街（北侧）" },
        { name: "C1", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["康顺家园"] },
        { name: "C2", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["幸福时光"] },
        { name: "D", lines: ["1号线"], desc: "新华西街（北侧）" },
    ],
    "M103": [
        { name: "A", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["呼和浩特市技工學校"] },
        { name: "B", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["呼和浩特热电开发经营总公司"] },
        { name: "C", lines: ["1号线"], desc: "新华西街（南侧）" },
        { name: "D", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["金海工业园区"] },
    ],
    "M104": [
        { name: "A", lines: ["1号线"], desc: "新华西街（北侧）" },
        { name: "B", lines: ["1号线"], desc: "新华西街（南侧）" },
        { name: "C", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["孔家营村委会"] },
        { name: "D", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["金海工业园区"] },
    ],
    "M105": [
        { name: "A", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["呼钢小区"] },
        { name: "C", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["呼和浩特市公共交通总公司第一汽车公司"] },
        { name: "D", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["金蒙国际艺术馆"] },
    ],
    "M106": [
        { name: "A", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["呼和浩特铁路第一中学"] },
        { name: "C1", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["乌兰夫纪念馆", "乌兰夫公园"] },
        { name: "C2", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["乌兰夫纪念馆", "乌兰夫公园"] },
        { name: "D", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["内蒙古建筑职业技术学院"] },
    ],
    "M107": [
        { name: "A1", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["内蒙古医科大学附属医院"] },
        { name: "A2", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["内蒙古医科大学"] },
        { name: "B", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["内蒙古自治区体育局"] },
        { name: "C", lines: ["1号线"], desc: "新华西街（南侧）", landmarks: ["同心公园"] },
        { name: "D", lines: ["1号线"], desc: "新华西街（北侧）", landmarks: ["内蒙古民族歌舞剧院"] },
    ],
    "M108": [
        { name: "A1", lines: ["1号线", "2号线"], desc: "新华大街（北侧），锡林郭勒北路（东侧）", landmarks: ["民族时代广场", "中国铁路呼和浩特局集团"] },
        { name: "B", lines: ["1号线", "2号线"], desc: "新华大街（南侧），锡林郭勒北路（东侧）", landmarks: ["内蒙古金融大厦"] },
        { name: "C", lines: ["1号线", "2号线"], desc: "新华大街（南侧），锡林郭勒北路（东侧）" },
        { name: "F", lines: ["1号线", "2号线"], desc: "新华大街（南侧），锡林郭勒北路（西侧）", landmarks: ["新华广场", "内蒙古大厦"] },
        { name: "H1", lines: ["1号线", "2号线"], desc: "新华大街（北侧），锡林郭勒北路（西侧）", landmarks: ["内蒙古电视台新闻中心"] },
        { name: "H2", lines: ["1号线", "2号线"], desc: "新华大街（北侧），锡林郭勒北路（西侧）", landmarks: ["内蒙古电视台新闻中心"] },
    ],
    "M109": [
        { name: "A1", lines: ["1号线"], desc: "新华东街（北侧）" },
        { name: "A2", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["内蒙古自治区煤矿安全监察局"] },
        { name: "B", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["清代绥远城阜安门遗址"] },
        { name: "C", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["内蒙古人民会堂", "呼和浩特博物馆", "内蒙古自治区人大常委会"] },
        { name: "D", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["新华大街63号院"] },
    ],
    "M110": [
        { name: "A", lines: ["1号线"], desc: "新华大街（南侧），南神马庙街，东落凤街", landmarks: ["新城区落凤街小学", "呼和浩特新城区住房和城乡建设局"] },
        { name: "B1", lines: ["1号线"], desc: "新华大街（南侧），昭乌达快速路（东侧）", landmarks: ["呼和浩特市实验中学", "关帝庙街小学", "内蒙古自治区烟草专卖局", "鼓楼小学"] },
        { name: "C2", lines: ["1号线"], desc: "新华大街（北侧），昭乌达快速路（东侧）", landmarks: ["将军衙署博物院"] },
    ],
    "M111": [
        { name: "A", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["内蒙古艺术学院"] },
        { name: "B", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["中国农业发展银行内蒙古自治区分行"] },
        { name: "C", lines: ["1号线"], desc: "新华大街（南侧）", landmarks: ["维多利国际广场"] },
        { name: "D", lines: ["1号线"], desc: "新华大街（北侧）", landmarks: ["呼和浩特市第十九中学"] },
    ],
    "M112": [
        { name: "A", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["煤炭大厦"] },
        { name: "B", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["茂业摩尔城"] },
        { name: "C", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["长乐宫购物中心"] },
        { name: "D1", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["呼和浩特市第十四中学"] },
        { name: "D2", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["昭君新村"] },
    ],
    "M113": [
        { name: "A", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["团结小区"] },
        { name: "B", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["呼和浩特体育活动中心"] },
        { name: "C", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["内蒙古展览馆"] },
        { name: "D", lines: ["1号线"], desc: "新华东街（北侧）" },
    ],
    "M114": [
        { name: "A", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["兴光大厦", "乌兰恰特大剧院演出中心", "内蒙古教育厅", "内蒙古自治区政协"] },
        { name: "C", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["万达广场呼和浩特店", "呼和浩特雕塑艺术馆"] },
        { name: "D", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["黑兰不塔小区", "内蒙古开放大学", "万达文华酒店"] },
        { name: "E", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["新家园", "交通投资集团", "内蒙古医药专修学院", "祥苑小区", "团结小区"] },
    ],
    "M115": [
        { name: "A", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["呼和浩特市人民政府"] },
        { name: "B", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["耕耘大厦"] },
        { name: "C", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["国际金融大厦", "呼和浩特市城市展示中心"] },
        { name: "D", lines: ["1号线"], desc: "新华东街（北侧）" },
    ],
    "M116": [
        { name: "A", lines: ["1号线"], desc: "东站前街（北侧）", landmarks: ["呼和浩特东站南广场"] },
        { name: "B", lines: ["1号线"], desc: "东站前街（南侧）" },
        { name: "F", lines: ["1号线"], desc: "东站前街（南侧）", landmarks: ["王府井奥莱·如意小镇", "内蒙古博物院"] },
        { name: "G", lines: ["1号线"], desc: "东站前街（北侧）", landmarks: ["呼和浩特东站南广场"] },
    ],
    "M117": [
        { name: "A1", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["内蒙古鸿德文理学院"] },
        { name: "A2", lines: ["1号线"], desc: "新华东街（北侧）", landmarks: ["水岸十里", "内蒙古机械职业学校"] },
        { name: "C", lines: ["1号线"], desc: "新华东街（南侧）", landmarks: ["呼和浩特市地铁控制中心", "内蒙古文联", "内蒙古交科路桥建设有限公司工程分公司", "赛罕区民族小学"] },
    ],
    "M118": [
        { name: "A", lines: ["1号线"], desc: "规划空港大道（南侧）", landmarks: ["什兰岱新村"] },
        { name: "B", lines: ["1号线"], desc: "规划空港大道（北侧）", landmarks: ["什兰岱新村"] },
    ],
    "M119": [
        { name: "A", lines: ["1号线"], desc: "空港大道（北侧）", landmarks: ["中国民用航空内蒙古安监局"] },
        { name: "B", lines: ["1号线"], desc: "空港大道（南侧）", landmarks: ["呼和浩特白塔国际机场国际航站楼"] },
    ],
    "M120": [
        { name: "A", lines: ["1号线"], desc: "空港大道（南侧）（仅供出站）", landmarks: ["呼和浩特白塔国际机场国内航站楼"] },
        { name: "B", lines: ["1号线"], desc: "空港大道（南侧）（仅供进站）" },
    ],
    "M201": [
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["塔利公租房"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["塔利新村小区"] },
    ],
    "M202": [
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["塔利停车场"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["内蒙古自治区国家大学科技园"] },
    ],
    "M203": [
        { name: "A", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["内蒙古意林食品有限公司"] },
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["内蒙古自治区大学生创业园"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["绿地之窗"] },
        { name: "D", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["呼市城投·东望"] },
    ],
    "M204": [
        { name: "A", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["内蒙古景苑生态园"] },
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["衡达丁香河畔"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["新城区博物馆"] },
        { name: "D", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["呼和浩特北山公园"] },
    ],
    "M205": [
        { name: "B1", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["名都和景小区"] },
        { name: "B2", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["呼和浩特市住房保障和房管局", "呼和浩特市住房和城乡建设局", "呼和浩特市房地产市场交易中心"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["一家村新村"] },
        { name: "D", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["新城区人民法院", "新城区人民检察院", "呼和浩特市公安局新城区分局"] },
    ],
    "M206": [
        { name: "A", lines: ["2号线"], desc: "成吉思汗东街（北侧）" },
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["呼和浩特恒大城"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["福欣小区"] },
        { name: "D", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["兴泰东河湾三期"] },
    ],
    "M207": [
        { name: "A", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["成吉思汗公园北区"] },
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["成吉思汗公园"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["内蒙古新闻出版数字大厦", "内蒙古民主党派大楼"] },
    ],
    "M208": [
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["成吉思汗美术馆", "阿尔泰游乐园", "昕泰大观", "蔚蓝家园"] },
        { name: "C", lines: ["2号线"], desc: "兴安北路（西侧），成吉思汗大街（南侧）", landmarks: ["金茂中心", "苏雅拉公园"] },
        { name: "D", lines: ["2号线"], desc: "兴安北路（西侧）", landmarks: ["维多利喜悦汇商场", "巨华·亲亲尚城小区"] },
    ],
    "M209": [
        { name: "B", lines: ["2号线"], desc: "成吉思汗大街（南侧）", landmarks: ["滨海生活广场", "财富港商业中心"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗大街（南侧）", landmarks: ["成吉思汗广场"] },
        { name: "D", lines: ["2号线"], desc: "成吉思汗大街（北侧）", landmarks: ["内蒙古体育职业学院"] },
    ],
    "M210": [
        { name: "A", lines: ["2号线"], desc: "成吉思汗东街（北侧）", landmarks: ["新城区政府"] },
        { name: "B", lines: ["2号线"], desc: "成吉思汗东街（南侧）", landmarks: ["日新大厦"] },
        { name: "C", lines: ["2号线"], desc: "成吉思汗大街（南侧）", landmarks: ["内蒙古体育馆"] },
        { name: "D", lines: ["2号线"], desc: "成吉思汗大街（北侧）", landmarks: ["天骄领域"] },
    ],
    "M211": [
        { name: "A", lines: ["2号线"], desc: "气象局西路（东侧）", landmarks: ["呼和浩特体育场"] },
        { name: "B", lines: ["2号线"], desc: "气象局西路（东侧）", landmarks: ["内蒙古赛马场"] },
        { name: "C", lines: ["2号线"], desc: "气象局西路（西侧）", landmarks: ["内蒙古赛马场"] },
        { name: "D", lines: ["2号线"], desc: "气象局西路（西侧）", landmarks: ["呼和浩特体育中心"] },
    ],
    "M212": [
        { name: "A", lines: ["2号线"], desc: "气象局西路（东侧）", landmarks: ["内蒙古自治区气象局", "内蒙古财经大学职业学院"] },
        { name: "B", lines: ["2号线"], desc: "气象局西路（东侧）", landmarks: ["内蒙古财经大学"] },
        { name: "D", lines: ["2号线"], desc: "气象局西路（西侧）", landmarks: ["和硕恪靖公主府"] },
    ],
    "M213": [
        { name: "A", lines: ["2号线"], desc: "锡林郭勒北路（东侧）", landmarks: ["国铁呼和浩特站"] },
        { name: "B", lines: ["2号线"], desc: "锡林郭勒北路（东侧）", landmarks: ["通达市场"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒北路（西侧）", landmarks: ["国贸批发城"] },
        { name: "D", lines: ["2号线"], desc: "锡林郭勒北路（西侧）", landmarks: ["国铁呼和浩特站", "呼和浩特长途汽车站"] },
    ],
    "M214": [
        { name: "A", lines: ["2号线"], desc: "锡林郭勒南路（东侧），人民巷", landmarks: ["丰泰金翡丽广场", "内蒙古自治区中医医院"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["海亮时代城", "维多利购物中心", "呼和浩特香格里拉大酒店", "内蒙古民族商厦"] },
        { name: "E", lines: ["2号线"], desc: "中山西路", landmarks: ["维多利购物中心", "内蒙古民族商厦"] },
    ],
    "M215": [
        { name: "A", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["呼和浩特市委小区"] },
        { name: "B", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["青城公园"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["呼和浩特万象城"] },
        { name: "D", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["青城公园"] },
    ],
    "M216": [
        { name: "A", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["山丹大厦"] },
        { name: "B", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["嘉茂购物中心", "金宇广场", "呼和浩特市赛罕区第二医院"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["凯德广场·诺和木勒"] },
        { name: "D", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["内蒙古电力科学研究院"] },
    ],
    "M217": [
        { name: "A", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["万和体育公园"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒南路（西侧）" },
        { name: "D", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["呼和浩特癫痫病医院"] },
    ],
    "M218": [
        { name: "A", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["五里营公园"] },
        { name: "B", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["秋实璟峯汇"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["万锦香颂"] },
        { name: "D", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["万锦融城"] },
    ],
    "M219": [
        { name: "B", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["锡林公园"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["美通批发市场"] },
        { name: "D", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["美通批发市场"] },
    ],
    "M220": [
        { name: "A", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["万达广场呼和浩特城南店"] },
        { name: "B", lines: ["2号线"], desc: "锡林郭勒南路（东侧）", landmarks: ["恒泰盛都"] },
        { name: "C", lines: ["2号线"], desc: "锡林郭勒南路（西侧）", landmarks: ["内蒙古大学南校区"] },
    ],
    "M221": [
        { name: "A", lines: ["2号线"], desc: "乌海东街（北侧）", landmarks: ["金地江山风华", "呼和浩特市第四十三中学"] },
        { name: "B", lines: ["2号线"], desc: "呼伦贝尔南路（东侧）", landmarks: ["内蒙古自治区女子强制隔离戒毒所"] },
        { name: "C", lines: ["2号线"], desc: "呼伦贝尔南路（西侧）", landmarks: ["少管所家属楼", "呼和浩特市第四中学南校区"] },
        { name: "D", lines: ["2号线"], desc: "呼伦贝尔南路（西侧）", landmarks: ["帅富家园", "恒泰盛都"] },
    ],
    "M222": [
        { name: "A", lines: ["2号线"], desc: "昭乌达路（北侧）", landmarks: ["呼和浩特市公安局城南公安分局", "呼和浩特第四中学分校", "中呼炼油小区", "呼和浩特市容管理局"] },
        { name: "B", lines: ["2号线"], desc: "昭乌达路（南侧）", landmarks: ["内蒙古自治区质量技术监督管理局", "锦绣嘉苑小区"] },
        { name: "D", lines: ["2号线"], desc: "昭乌达路（北侧）", landmarks: ["西喇嘛营村", "爱巢8090小区", "海洋石油天野小区"] },
    ],
    "M223": [
        { name: "A", lines: ["2号线"], desc: "展览馆东路（东侧）" },
        { name: "B", lines: ["2号线"], desc: "展览馆东路（东侧）", landmarks: ["喇嘛营车辆段"] },
        { name: "C", lines: ["2号线"], desc: "展览馆东路（西侧）", landmarks: ["金桥景观花园"] },
        { name: "D", lines: ["2号线"], desc: "展览馆东路（西侧）", landmarks: ["中油呼炼小区"] },
    ],
};

(function () {
    "use strict";
    window.HOHHOT_STATION_EXITS = HOHHOT_STATION_EXITS;
})();
