/**
 * CGo OpenMap - 沈阳车站设施数据
 *
 * ⚠️ 本文件由脚本生成，请勿手工编辑。生成脚本是维护者本地的开发期离线工具
 *   （不进运行时、也不入版本库）：drunk/tools/facilities/fetch_shenyang_facilities.js；
 *   重跑方式与取数口径见 docs/STATION_FACILITIES_RESEARCH.md。
 *
 * 数据来源：沈阳地铁官网设施接口
 *   POST https://www.symtc.com/portalManager/selectDeviceInfoByDC
 * 采集口径与清洗规则见 docs/STATION_FACILITIES_RESEARCH.md 与脚本头部注释。
 *
 * 结构：本地车站 ID → 设施数组，按官网 deviceId 升序；
 *   type     归一化类别（对应官网 deviceId，展示名与图标在渲染模块里）
 *   location 位置段数组，已按楼层由地面到站台排序；每段是纯字符串，
 *            **多线换乘站**则升级为 { line, text } 对象——换乘站的「站厅层 / 站台层」
 *            必须能分辨是哪条线的，line 即该段所属线路的稳定 ID（SYM01…）；
 *            被确认由两线共用的位置（共用站厅、同一出入口、换乘通道）已跨线合并，
 *            合并后的段落不再挂 line（它不属于某一条线）。text 是位置原文。
 * 未收录的车站（有轨电车、国铁、未纳入官网编号体系的在建站）不渲染该模块。
 *
 * 官网数据非实时同步，与现场可能不一致，展示时应注明来源。
 */
const SHENYANG_STATION_FACILITIES = {
    "0101": [
        { type: "service_center", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "地面-站厅 D出入口附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层A、B出入口",
            "站厅层C、D出入口工作日（早晚高峰时段5：20-9：00，16：40-18：00）",
            "站厅层C、D出入口非工作日（5：20-9：00）",
        ] },
        { type: "escalator_down", location: [
            "站厅层 C、D 出入口 工作日（平峰时段9:00-16:40,18:00-运营结束）",
            "站厅层 C、D 出入口 非工作日（9:00-运营结束）",
        ] },
    ],
    "0102": [
        { type: "service_center", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "地面-站厅 D出入口附近",
        ] },
        { type: "escalator_up", location: ["站厅层 A、B、C、D出入口"] },
    ],
    "0103": [
        { type: "service_center", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "elevator", location: [
            "地面-过街通道-站厅 A出入口附近",
            "地面-过街通道-站厅 D出入口附近",
        ] },
        { type: "escalator_up", location: ["站厅层 A、B、C、D出入口"] },
    ],
    "0104": [
        { type: "service_center", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "elevator", location: [
            "地面-过街通道-站厅 A出入口附近",
            "地面-过街通道-站厅 D出入口附近",
        ] },
        { type: "escalator_up", location: ["站厅层 A、B、C、D出入口"] },
    ],
    "0105": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往十三号街方向尾端位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往十三号街方向尾端位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、 B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0106": [
        { type: "service_center", location: ["站厅层 A、B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0107": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 Ｂ出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "shengjingtong", location: ["站厅层 B、C出入口附近"] },
    ],
    "0108": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0109": [
        { type: "service_center", location: ["站厅层 A、B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往十三号街方向车尾位置"] },
        { type: "accessible_toilet", location: ["站台层 开往十三号街方向车尾位置"] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0110": [
        { type: "service_center", location: ["站厅层 A、B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0111": [
        { type: "service_center", location: [
            "站厅层 A出入口附近",
            "站厅层 B、C出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B、C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 B、C出入口附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C出入口附近",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0112": [
        { type: "service_center", location: [
            { line: "SYM01", text: "站厅层 A、B出入口附近" },
            { line: "SYM09", text: "站厅层 H出入口附近" },
            { line: "SYM09", text: "站厅层 G出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM01", text: "站厅层 D出入口附近" },
            { line: "SYM01", text: "站厅层 A出入口附近" },
            { line: "SYM09", text: "站厅层 H出入口附近" },
            { line: "SYM09", text: "站厅层 G出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM01", text: "站厅层 A、B出入口附近" },
            { line: "SYM09", text: "站厅层 H出入口附近" },
            { line: "SYM01", text: "站台层 开往双马方向车头位置" },
            { line: "SYM09", text: "站台层 开往怒江公园方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM01", text: "站厅层 A、B出入口附近" },
            { line: "SYM09", text: "站厅层 H出入口附近" },
            { line: "SYM09", text: "站台层 开往怒江公园方向车头位置" },
        ] },
        { type: "nursing_room", location: [{ line: "SYM01", text: "站台层 开往双马方向车头位置" }] },
        { type: "elevator", location: [
            { line: "SYM01", text: "地面-站厅 A出入口附近" },
            { line: "SYM09", text: "地面-站厅 H出入口附近" },
            { line: "SYM01", text: "站厅-站台 站厅中部位置" },
            { line: "SYM09", text: "站厅-站台 站厅H口附近" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM01", text: "站厅层 A、B、C出入口" },
            { line: "SYM09", text: "站厅层 H出入口" },
            { line: "SYM01", text: "站台层 站台两端位置附近" },
            { line: "SYM09", text: "站台层 站台中部和站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM09", text: "地面层 H出入口" },
            { line: "SYM09", text: "站厅层 站厅两端位置附近" },
        ] },
        { type: "shengjingtong", location: [{ line: "SYM09", text: "H出入口附近" }] },
    ],
    "0113": [
        { type: "service_center", location: ["站厅层 C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "elevator", location: ["站厅-站台 站厅中部位置"] },
        { type: "escalator_up", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0114": [
        { type: "service_center", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 L1下方附近",
            "站厅层 C、D出入口附近",
            "L1层附近",
        ] },
        { type: "toilet", location: ["站台层 开往双马方向车头位置"] },
        { type: "accessible_toilet", location: ["站台层 开往双马方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、L1、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["站厅层 L1"] },
    ],
    "0115": [
        { type: "service_center", location: [
            { line: "SYM01", text: "站厅层B、C出入口附近" },
            { line: "SYM04", text: "站厅层 E出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM01", text: "站厅层 A出入口附近" },
            { line: "SYM01", text: "站厅层 B出入口附近" },
            { line: "SYM04", text: "站厅层 F出入口附近" },
            { line: "SYM04", text: "站厅层 E出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM04", text: "站厅层 E出入口附近" },
            { line: "SYM01", text: "站台层 开往双马方向车尾位置" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM04", text: "站厅层 E出入口附近" },
            { line: "SYM01", text: "站台层 开往双马方向车尾位置" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
        ] },
        { type: "nursing_room", location: [
            { line: "SYM04", text: "站厅层 E出入口附近" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
        ] },
        { type: "elevator", location: [
            { line: "SYM01", text: "地面-站厅 B出入口附近" },
            { line: "SYM04", text: "地面-站厅 站厅层F出入口附近" },
            { line: "SYM01", text: "站厅-站台 站厅中部位置" },
            { line: "SYM04", text: "站厅-站台 站厅付费区内E出入口附近" },
            { text: "（太原街站1、4号线换乘电梯）换乘通道内电扶梯附近" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM01", text: "站厅层 A、B出入口" },
            { line: "SYM04", text: "站厅层 G、E、F出入口" },
            { line: "SYM01", text: "站台层 站台两端位置附近" },
            { line: "SYM04", text: "站台层 站台中部和站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM04", text: "地面层 G、E、F出入口" },
            { line: "SYM04", text: "站厅层 F出入口附近及站厅中部位置附近" },
        ] },
        { type: "shengjingtong", location: [{ line: "SYM01", text: "A出入口附近" }] },
    ],
    "0116": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0117": [
        { type: "service_center", location: [
            { text: "站厅层 B、C出入口附近" },
            { text: "站厅层 A、D出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { text: "站厅层 B出入口附近" },
            { text: "站厅层 A、D出入口附近" },
        ] },
        { type: "toilet", location: [
            { text: "站厅层 A出入口附近" },
            { line: "SYM01", text: "站台层 开往双马方向车头位置" },
            { line: "SYM02", text: "站台层 开往桃仙机场车头方向步梯下附近位置" },
        ] },
        { type: "accessible_toilet", location: [
            { text: "站厅层 A出入口附近" },
            { line: "SYM01", text: "站台层 开往双马方向车头位置" },
        ] },
        { type: "elevator", location: [
            { text: "地面-站厅 A、B出入口附近" },
            { text: "站厅-站台 B、C出入口附近（一号线换乘至桃仙机场方向）" },
            { text: "站厅-站台 A、D出入口附近（一号线换乘至蒲田路方向）" },
        ] },
        { type: "escalator_up", location: [
            { text: "站厅层 A、B、C出入口" },
            { line: "SYM01", text: "站台层 站台两端位置附近" },
            { line: "SYM02", text: "站台层 站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { text: "地面层 C出入口、B出入口（仅下半段）" },
            { text: "站厅层 站厅中部位置附近" },
        ] },
    ],
    "0118": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "shengjingtong", location: ["B、C出入口附近"] },
    ],
    "0119": [
        { type: "service_center", location: ["站厅层 站厅AB出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往双马方向车头位置"] },
        { type: "accessible_toilet", location: ["站台层 开往双马方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 B1出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、B1、B2、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 B1、B2、C出入口"] },
    ],
    "0120": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往十三号街方向车尾位置"] },
        { type: "accessible_toilet", location: ["站台层 开往十三号街方向车尾位置"] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "shengjingtong", location: ["站厅层 A、D出入口附近"] },
    ],
    "0121": [
        { type: "service_center", location: [
            { line: "SYM01", text: "站厅层 A、B、C出入口附近" },
            { line: "SYM10", text: "站厅层 G出入口附近" },
            { line: "SYM10", text: "站厅层 G、H出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM01", text: "站厅层 A出入口附近" },
            { line: "SYM01", text: "站厅层 B出入口附近" },
            { line: "SYM01", text: "站厅层 C出入口附近" },
            { line: "SYM10", text: "站厅层 H出入口附近" },
            { line: "SYM10", text: "站厅层 E出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM01", text: "站厅层 B出入口附近" },
            { line: "SYM10", text: "站厅层 E出入口附近" },
            { line: "SYM10", text: "站台层 开往丁香湖方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM01", text: "站厅层 B出入口附近" },
            { line: "SYM10", text: "站厅层 E出入口附近" },
        ] },
        { type: "nursing_room", location: [{ line: "SYM10", text: "站台层 开往丁香湖方向车头位置" }] },
        { type: "elevator", location: [
            { line: "SYM10", text: "地面-站厅 G出入口附近" },
            { line: "SYM10", text: "站厅-站台 站厅E口附近" },
            { line: "SYM01", text: "站厅-设备层 站厅层B出入口附近" },
            { line: "SYM01", text: "设备层-站台 设备层C出入口附近" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM10", text: "站厅层 G、E、H出入口" },
            { line: "SYM10", text: "站厅层 长换乘通道位置附近" },
            { line: "SYM01", text: "设备层 付费区A、B出入口附近位置" },
            { line: "SYM01", text: "站台层 站台两端位置附近" },
            { line: "SYM10", text: "站台层 站台两端及中部位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM10", text: "地面层G、E、H出入口" },
            { line: "SYM10", text: "站厅层 站厅两端位置附近、设备层附近" },
            { line: "SYM10", text: "站厅层 长换乘通道位置附近" },
        ] },
    ],
    "0122": [
        { type: "service_center", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: ["站厅层 C出入口附近"] },
        { type: "accessible_toilet", location: ["站厅层 C出入口附近"] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "地面-站厅 D出入口附近",
        ] },
        { type: "escalator_up", location: ["站厅层 A、B、C出入口"] },
    ],
    "0123": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 A、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0124": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C1、C2出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C1、C2出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C1、C2出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C1、C2出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C2出入口附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C1、C2出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 B、C1、C2出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0125": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、D出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0126": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 D出入口附近",
            "站台层 开往十三号街方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0127": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、D出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站台中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0128": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站台中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0129": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 D出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站台中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 B、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0130": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、D出入口附近",
            "站厅层 B、C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、D出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 D出入口附近",
            "站台层 开往双马方向车头位置",
        ] },
        { type: "elevator", location: [
            "站厅-地面 C出入口附近",
            "站台-站厅 站台中部",
        ] },
        { type: "escalator_up", location: ["站台层 站台两端位置附近，站厅层A、B、C、D出入口"] },
        { type: "escalator_down", location: ["站台层 站台两端位置附近，站厅层A、B、C、D出入口"] },
    ],
    "0131": [
        { type: "service_center", location: ["站厅层 中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "地面层 A出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "地面层 A出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "地面层 A出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站台中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0132": [
        { type: "service_center", location: ["站厅层中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往十三号街方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A出入口附近",
            "站台层 开往双马方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站台-站厅 站台中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、C出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0201": [
        { type: "service_center", location: ["站厅层 A、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A、C出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、C出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、C出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 A、C出入口"] },
        { type: "shengjingtong", location: ["站厅层 B出入口附近"] },
    ],
    "0202": [
        { type: "service_center", location: ["站厅层 A、B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站台层 开往蒲田路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口附近",
            "站台层 开往蒲田路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 B、C出入口"] },
    ],
    "0203": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往蒲田路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往蒲田路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 B出入口"] },
    ],
    "0204": [
        { type: "service_center", location: [
            "站厅层 A、B出入口附近",
            "站厅层 D、E出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 D、E出入口附近",
            "站厅层 A、B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D、E出入口附近",
            "站台层 开往蒲田路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D、E出入口附近",
            "站台层 开往蒲田路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 E出入口附近",
            "站厅-站台 站厅D、E出入口附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D、E出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0205": [
        { type: "service_center", location: [
            { line: "SYM02", text: "站厅层 B、C出入口附近" },
            { line: "SYM10", text: "站厅层 F、G出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM02", text: "站厅层 B、C出入口附近" },
            { line: "SYM02", text: "站厅层 A出入口附近" },
            { line: "SYM10", text: "站厅层 F、G出入口附近" },
            { line: "SYM10", text: "站厅层 H出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM02", text: "站厅层 A出入口附近" },
            { line: "SYM10", text: "站厅层 H出入口附近" },
            { line: "SYM02", text: "站台层 开往蒲田路方向车头位置" },
            { line: "SYM10", text: "站台层 开往张沙布方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM02", text: "站厅层 A出入口附近" },
            { line: "SYM10", text: "站厅层 H出入口附近" },
            { line: "SYM10", text: "站台层 开往张沙布方向车头位置" },
        ] },
        { type: "nursing_room", location: [{ line: "SYM02", text: "站台层 开往蒲田路方向车头位置" }] },
        { type: "elevator", location: [
            { line: "SYM02", text: "地面-站厅 C出入口附近" },
            { line: "SYM10", text: "地面-站厅 F出入口附近" },
            { line: "SYM02", text: "站厅-站台 站厅中部位置" },
            { line: "SYM10", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM02", text: "站厅层 A、B、C出入口" },
            { line: "SYM10", text: "站厅层 F、G、H出入口" },
            { line: "SYM10", text: "站厅层 2换10通道位置附近" },
            { line: "SYM02", text: "站台层 站台两端位置附近" },
            { line: "SYM10", text: "站台层 站台中部位置附近" },
            { line: "SYM10", text: "站台层 站台A端位置附近" },
            { line: "SYM10", text: "站台层 站台F、G出入口端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM02", text: "地面层 A、B出入口" },
            { line: "SYM10", text: "地面层 F、G、H出入口" },
            { line: "SYM02", text: "站厅层 站厅中部位置附近" },
            { line: "SYM10", text: "站厅层 10换2通道位置附近" },
            { line: "SYM10", text: "站厅层 站厅换乘通道附近" },
        ] },
    ],
    "0206": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0207": [
        { type: "service_center", location: [
            { line: "SYM02", text: "站厅层 站厅中部位置" },
            { line: "SYM04", text: "站厅层 站厅中部位置" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM04", text: "地下一层 F、H出入口附近" },
            { line: "SYM02", text: "站厅层 A出入口附近" },
            { line: "SYM02", text: "站厅层 B出入口附近" },
            { line: "SYM04", text: "站厅层 E、F出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM02", text: "地下一层 A出入口附近" },
            { line: "SYM04", text: "地下一层 H出入口附近" },
            { line: "SYM02", text: "站台层 开往桃仙机场方向车尾位置" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM02", text: "地下一层 A出入口附近" },
            { line: "SYM04", text: "地下一层 H出入口附近" },
            { line: "SYM02", text: "站台层 开往桃仙机场方向车尾位置" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
        ] },
        { type: "nursing_room", location: [
            { line: "SYM02", text: "地下一层 A出入口附近" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
        ] },
        { type: "elevator", location: [
            { line: "SYM02", text: "地面-站厅 B出入口附近" },
            { line: "SYM04", text: "地面-站厅 H出入口附近" },
            { line: "SYM02", text: "站厅-站台 站厅中部位置" },
            { line: "SYM04", text: "站厅-站台 站厅换乘通道附近" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM02", text: "地下一层 A、B出入口" },
            { line: "SYM04", text: "地下一层 F、H、L1出入口" },
            { line: "SYM04", text: "站厅层 站厅E出入口附近" },
            { line: "SYM02", text: "站厅层 站厅两端位置附近" },
            { line: "SYM04", text: "站厅层 站厅两端位置附近" },
            { line: "SYM04", text: "设备层 设备层中部位置附近" },
            { line: "SYM02", text: "站台层 站台两端位置附近" },
            { line: "SYM04", text: "站台层 站台中部及两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM02", text: "地面层 A、B出入口" },
            { line: "SYM04", text: "地面层 E（出入口下段）、F、H、L1出入口" },
            { line: "SYM02", text: "地下一层 地下一层两端位置附近" },
            { line: "SYM04", text: "地下一层 地下一层两端位置附近" },
            { line: "SYM02", text: "站厅层 站厅两端位置附近" },
            { line: "SYM04", text: "站厅层 站厅中部及两端位置附近" },
            { line: "SYM04", text: "设备层 设备层中部位置" },
        ] },
        { type: "shengjingtong", location: [{ line: "SYM02", text: "站厅层 B出入口附近" }] },
    ],
    "0208": [
        { type: "service_center", location: [
            "站厅层 B、C出入口附近",
            "站厅层 A、D出入口附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 B、C出入口附近",
            "站厅层 A、D出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往桃仙机场方向车尾位置"] },
        { type: "accessible_toilet", location: ["站台层 开往桃仙机场方向车尾位置"] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅A、D出入口附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 C、D出入口"] },
    ],
    "0209": [
        { type: "service_center", location: ["站厅层 C、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C、D出入口附近",
            "站厅层 A、E出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、E出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、E出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 E出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、C2、D、E、E2出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 C、C2、D、E、出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0211": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B（出入口下段）、A、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 A出入口"] },
    ],
    "0212": [
        { type: "service_center", location: [
            { line: "SYM02", text: "站厅层 C出入口附近" },
            { line: "SYM03", text: "站厅层 站厅中部" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM02", text: "站厅层 B出入口附近" },
            { line: "SYM02", text: "站厅层 C出入口附近" },
            { line: "SYM03", text: "站厅层 E、F出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM03", text: "站厅层 F口出入口旁" },
            { line: "SYM02", text: "站台层 开往桃仙机场方向车头位置" },
            { line: "SYM03", text: "站台层 开往李达方向车头" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM03", text: "站厅层 F口出入口附近" },
            { line: "SYM02", text: "站台层 开往桃仙机场方向车头位置" },
            { line: "SYM03", text: "站台层 开往方家栏方向车尾" },
        ] },
        { type: "nursing_room", location: [
            { line: "SYM03", text: "站厅层 F口出入口附近" },
            { line: "SYM03", text: "站台层 开往李达方向车头" },
        ] },
        { type: "elevator", location: [
            { line: "SYM02", text: "地面-站厅 B出入口附近" },
            { line: "SYM03", text: "地面-站厅 G1出入口" },
            { line: "SYM02", text: "站厅-站台 站厅中部位置" },
            { line: "SYM03", text: "站厅-站台 站厅中部" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM02", text: "站厅层 B、C出入口" },
            { line: "SYM03", text: "站厅层 G1、G2、E、F出入口" },
            { line: "SYM02", text: "设备层 设备层中部位置附近" },
            { line: "SYM02", text: "站台层 站台中部及两端位置附近" },
            { line: "SYM03", text: "站台层 站台两端" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM02", text: "地面层 B出入口" },
            { line: "SYM03", text: "站厅层 G1、G2、E、F出入口" },
            { line: "SYM02", text: "站厅层 站厅中部位置附近" },
            { line: "SYM03", text: "站台层 站台两端" },
        ] },
        { type: "shengjingtong", location: [{ line: "SYM02", text: "B出入口附近" }] },
    ],
    "0213": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B、B2出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、B2出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、B2出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0214": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 站厅两端位置附近",
            "设备层 设备层中部位置附近",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 站厅中部位置附近",
            "设备层 设备层中部位置附近",
        ] },
    ],
    "0215": [
        { type: "service_center", location: [
            { line: "SYM02", text: "站厅层 A出入口附近" },
            { line: "SYM09", text: "站厅层 F、G出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM02", text: "站厅层 A出入口附近" },
            { line: "SYM02", text: "站厅层 B出入口附近" },
            { line: "SYM09", text: "站厅层 F、G出入口附近" },
            { line: "SYM09", text: "站厅层 E出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM02", text: "站厅层 B出入口附近" },
            { line: "SYM09", text: "站厅层 F、G出入口附近" },
            { line: "SYM02", text: "站台层 开往桃仙机场方向车尾位置" },
            { line: "SYM09", text: "站台层 开往怒江公园方向车尾位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM02", text: "站厅层 B出入口附近" },
            { line: "SYM09", text: "站厅层 F、G出入口附近" },
            { line: "SYM02", text: "站台层 开往桃仙机场方向车尾位置" },
            { line: "SYM09", text: "站台层 开往怒江公园方向车尾位置" },
        ] },
        { type: "elevator", location: [
            { line: "SYM02", text: "地面-站厅 A出入口附近" },
            { line: "SYM09", text: "地面-站厅 G出入口附近" },
            { line: "SYM02", text: "站厅-站台 站厅中部位置" },
            { line: "SYM09", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM02", text: "站厅层 A、B出入口" },
            { line: "SYM09", text: "站厅层 E、F、G出入口" },
            { line: "SYM02", text: "站台层 站台两端位置附近" },
            { line: "SYM09", text: "站台层 站台中部及两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM02", text: "地面层 A、B出入口" },
            { line: "SYM09", text: "地面层 E、F出入口" },
            { line: "SYM09", text: "站厅层 站厅中部位置附近" },
            { line: "SYM09", text: "站厅乘客服务中心后方位置附近" },
        ] },
        { type: "shengjingtong", location: [{ line: "SYM02", text: "站厅层 B、B2出入口附近" }] },
    ],
    "0216": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0217": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 B出入口"] },
    ],
    "0218": [
        { type: "service_center", location: ["站厅层 D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 C、D出入口"] },
    ],
    "0219": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: ["站厅-站台 站厅中部位置"] },
        { type: "escalator_up", location: ["站台层 站台两端位置附近"] },
        { type: "escalator_down", location: ["站厅层 站厅两端位置附近"] },
    ],
    "0220": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 B、 C出入口附近",
            "站厅层 A出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A1出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A1、A2、B、C出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0221": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 A、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、D出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、D出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、C、D出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0222": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "nursing_room", location: ["站台层 开往桃仙机场方向车尾位置"] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0223": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "nursing_room", location: ["站台层 开往桃仙机场方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0224": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 开往蒲田路方向车头位置附近",
        ] },
    ],
    "0225": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、C出入口",
            "站台层 开往蒲田路方向车头位置",
        ] },
    ],
    "0226": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 B出入口附近"] },
        { type: "toilet", location: [
            "站厅层 机场联建通道附近",
            "站台层 开往桃仙机场方向车尾位置",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 机场联建通道附近",
            "站台层 开往桃仙机场方向车尾位置",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 机场联建通道附近",
            "站台层 开往桃仙机场方向车尾位置",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C出入口",
            "站台层 站厅付费区两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B出入口",
            "站厅层 站厅付费区两端位置附近",
        ] },
    ],
    "0251": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 B出入口"] },
    ],
    "0252": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A、D出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 A、B、D出入口"] },
    ],
    "0253": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 A出入口"] },
        { type: "shengjingtong", location: ["站厅层 C出入口附近"] },
    ],
    "0254": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C、C1出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C、C1出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、D、C、C1出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 A、C1出入口"] },
    ],
    "0255": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 A出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往蒲田路方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 A、B、C出入口"] },
    ],
    "0256": [
        { type: "service_center", location: ["站厅层 C、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C、D出入口附近",
            "站厅层 A、B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往桃仙机场方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、D出入口",
            "站厅层 站厅A端位置附近",
        ] },
    ],
    "0257": [
        { type: "service_center", location: ["站厅层 E出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 E出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 E出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 E出入口附近",
            "站台层 开往桃仙机场方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 E出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、E出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: ["地面层 C、E出入口"] },
    ],
    "0301": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅A1出入口楼梯旁"] },
        { type: "accessible_toilet", location: ["站厅层 站厅A1出入口楼梯旁"] },
        { type: "nursing_room", location: ["站厅层 站厅A1出入口楼梯旁"] },
        { type: "elevator", location: [
            "地面-站厅 A1、A2口中部",
            "站厅-站台 站厅东侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、B1、B2出入口",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A2、B1出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台车头位置附近",
        ] },
    ],
    "0302": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅A1出入口电扶梯旁"] },
        { type: "accessible_toilet", location: ["站厅层 站厅A1出入口电扶梯旁"] },
        { type: "nursing_room", location: ["站厅层 站厅A1出入口电扶梯旁"] },
        { type: "elevator", location: [
            "地面-站厅 A1、A2口中部",
            "站厅-站台 站厅东侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、B1、B2出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A1、B1出入口",
            "站台层 李达方向站台车尾位置附近",
            "站台层 方家栏方向站台车尾位置附近",
        ] },
    ],
    "0303": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅B1出入口电扶梯旁"] },
        { type: "accessible_toilet", location: ["站厅层 站厅B1出入口电扶梯旁"] },
        { type: "nursing_room", location: ["站厅层 站厅B1出入口电扶梯旁"] },
        { type: "elevator", location: [
            "地面-站厅 B1、B2口中部",
            "站厅-站台 站厅东侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、B1、B2出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A1、B1出入口",
            "站台层 李达方向站台车头位置附近",
            "站台层 方家栏方向站台车头位置附近",
        ] },
    ],
    "0304": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅西侧付费区"] },
        { type: "accessible_toilet", location: ["站厅层 站厅西侧付费区"] },
        { type: "nursing_room", location: ["站厅层 站厅西侧付费区"] },
        { type: "elevator", location: [
            "地面-站厅 A口附近",
            "站厅-站台 站厅西侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B1、B2出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 B2出入口",
            "站台层 李达方向站台车尾位置附近",
            "站台层 方家栏方向站台车尾位置附近",
        ] },
    ],
    "0305": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅A出入口电扶梯斜对面"] },
        { type: "accessible_toilet", location: ["站厅层 站厅A出入口电扶梯斜对面"] },
        { type: "nursing_room", location: ["站厅层 站厅A出入口电扶梯斜对面"] },
        { type: "elevator", location: [
            "地面-站厅 A口附近",
            "站厅-站台 站厅东侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B1、B2出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B1出入口",
            "站台层 李达方向站台车头位置附近",
            "站台层 方家栏方向站台车头位置附近",
        ] },
    ],
    "0306": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅西侧付费区"] },
        { type: "accessible_toilet", location: ["站厅层 站厅西侧付费区"] },
        { type: "nursing_room", location: ["站厅层 站厅西侧付费区"] },
        { type: "elevator", location: [
            "地面-站厅 B口",
            "站厅-站台 站厅西侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A出入口",
            "站台层 李达方向站台车尾位置附近",
            "站台层 方家栏方向站台车尾位置附近",
        ] },
    ],
    "0307": [
        { type: "service_center", location: [
            "站厅层 A口进站闸机处",
            "站厅层 B口进站闸机处",
        ] },
        { type: "ticket_machine", location: ["站厅层 A口、B口附近"] },
        { type: "toilet", location: ["站厅层 站厅付费区A出入口附近"] },
        { type: "accessible_toilet", location: ["站厅层 站厅付费区A出入口附近"] },
        { type: "elevator", location: [
            "地面-站厅 B口",
            "站厅-站台 站厅南侧",
            "站厅-站台 站厅北侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B出入口",
            "站厅层 开往方家栏方向车尾位置",
            "站厅层 开往李达方向车尾位置",
        ] },
    ],
    "0308": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅A1出入口电扶梯旁"] },
        { type: "accessible_toilet", location: ["站厅层 站厅A1出入口电扶梯旁"] },
        { type: "nursing_room", location: ["站厅层 站厅A1出入口电扶梯旁"] },
        { type: "elevator", location: [
            "地面-站厅 A1、A2口中部",
            "站厅-站台 站厅东侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、B1、B2出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A1、B1出入口",
            "站台层 李达方向站台车尾位置附近",
            "站台层 方家栏方向站台车尾位置附近",
        ] },
    ],
    "0309": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部"] },
        { type: "toilet", location: ["站厅层 站厅A1出入口电扶梯旁"] },
        { type: "accessible_toilet", location: ["站厅层 站厅A1出入口楼梯旁"] },
        { type: "nursing_room", location: ["站厅层 站厅A1出入口楼梯旁"] },
        { type: "elevator", location: [
            "地面-站厅 A1、A2口中部",
            "站厅-站台 站厅东侧",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、B1、B2出入口",
            "站台层 李达方向站台两端位置附近",
            "站台层 方家栏方向站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A1、B1出入口",
            "站台层 李达方向站台车尾位置附近",
            "站台层 方家栏方向站台车尾位置附近",
        ] },
    ],
    "0310": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅"] },
        { type: "toilet", location: [
            "站厅层 站厅A、D口附近",
            "站台层 站台开往李达方向尾端",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 站厅A、D口附近",
            "站台层 站台开往李达方向尾端",
        ] },
        { type: "nursing_room", location: [
            "站厅层 站厅A、D口附近",
            "站台层 站台开往李达方向尾端",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C口",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0311": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅"] },
        { type: "toilet", location: [
            "站厅层 站厅A、D口附近",
            "站台层 站台开往方家栏方向车头端门",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 站厅A口附近",
            "站台层 站台开往李达方向尾端门",
        ] },
        { type: "nursing_room", location: [
            "站厅层 站厅A口附近",
            "站台层 站台开往李达方向尾端门",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C口",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0312": [
        { type: "service_center", location: ["站厅层 站厅中部C、D口附近"] },
        { type: "ticket_machine", location: ["站厅层 站厅"] },
        { type: "toilet", location: [
            "站厅层 站厅A1口、D口附近",
            "站台层 站台开往方家栏方向头端门",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 站厅A1口、D口附近",
            "站台层 站台开往方家栏方向头端门",
        ] },
        { type: "nursing_room", location: [
            "站厅层 站厅A1口、D口附近",
            "站台层 站台开往方家栏方向头端门",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A1口附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A1、A2、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0314": [
        { type: "service_center", location: ["站厅层 站厅中部C、D口附近"] },
        { type: "ticket_machine", location: ["站厅层 站厅"] },
        { type: "toilet", location: [
            "站厅层 站厅A、D口附近",
            "站台层 站台开往方家栏方向头端门",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 站厅A、D口附近",
            "站台层 站台开往方家栏方向头端门",
        ] },
        { type: "nursing_room", location: [
            "站厅层 站厅A、D口附近",
            "站台层 站台开往方家栏方向头端门",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D口",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0315": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅两端"] },
        { type: "toilet", location: ["站厅层 C出入口安检机对面；站台层 开往方家栏方向车尾"] },
        { type: "accessible_toilet", location: ["站厅层 C出入口安检机对面；站台层 开往李达方向车头"] },
        { type: "nursing_room", location: [
            "站厅层 C出入口安检机对面",
            "站台层 开往李达方向车头",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口楼梯旁",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C出入口",
            "站台层 站台两端附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、C出入口",
            "站台层 站台两端附近",
        ] },
    ],
    "0317": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅两端"] },
        { type: "toilet", location: [
            "站厅层 站厅B出入口方向出站闸前方",
            "站台层开往方家栏方向车尾与开往李达方向车头",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 站厅B出入口方向出站闸机前方",
            "站台层 开往方家栏方向车尾",
        ] },
        { type: "nursing_room", location: [
            "站厅层 站厅B出入口方向出站闸机前方",
            "站台层 开往方家栏方向车尾",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A出入口、B出入口",
            "站台层 站台两端",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A出入口",
            "站台层 站台两端",
        ] },
    ],
    "0318": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅两端"] },
        { type: "toilet", location: [
            "站厅层 A出入口安检机对面",
            "站台层 开往方家栏方向车头与开往李达方向车尾",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口安检机对面",
            "站台层 开往方家栏方向车头",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A出入口安检机对面",
            "站台层 开往方家栏方向车头",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B口后方",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0319": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅两端"] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往李达方向车头",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站厅层 开往李达方向车头",
        ] },
        { type: "nursing_room", location: [
            "站厅层 B出入口附近",
            "站厅层 开往李达方向车头",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端",
        ] },
    ],
    "0320": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅两端"] },
        { type: "toilet", location: [
            "站厅层 A、D出入口中间",
            "站台层 开往方家栏方向车头",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、D出入中间",
            "站台层 开往方家栏方向车头",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A、D出入口中间",
            "站台层 开往方家栏方向车头",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口通道",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端",
        ] },
    ],
    "0322": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅两端"] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往李达方向车尾",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往李达方向车尾",
        ] },
        { type: "nursing_room", location: [
            "站厅层 D出入口附近",
            "站台层 开往李达方向车尾",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口通道附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、D出入口",
            "站台层 站台两端",
        ] },
        { type: "escalator_down", location: [
            "站厅层 B、D出入口",
            "站台层 站台两端",
        ] },
    ],
    "0323": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 D出入口安检机附近、E出入口通道附近"] },
        { type: "toilet", location: [
            "站厅层 C出入口楼梯附近",
            "站台层 开往方家栏方向车尾",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口楼梯附近",
            "站台层 开往方家栏方向车尾",
        ] },
        { type: "nursing_room", location: ["站台层 开往李达方向车头"] },
        { type: "elevator", location: [
            "地面-站厅 D出入口通道",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、D、E出入口",
            "站台层 站台两端、站台中部",
        ] },
        { type: "escalator_down", location: [
            "站厅层 C、D、E出入口",
            "站台层 开往方家栏方向车尾附近",
        ] },
    ],
    "0324": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅两端"] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往李达方向车头",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往李达方向车头",
        ] },
        { type: "nursing_room", location: ["站台层 开往方家栏方向车尾"] },
        { type: "elevator", location: [
            "地面-站厅 A出入口",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B1、B2出入口",
            "站台层 站台两端",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B2出入口",
            "站台层 站台两端",
        ] },
    ],
    "0325": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 站厅中部、A出入口附近"] },
        { type: "toilet", location: ["站厅层 B出入口附近"] },
        { type: "accessible_toilet", location: ["站厅层 B出入口附近"] },
        { type: "nursing_room", location: ["站厅层 B出入口附近（无障碍卫生间兼母婴室）"] },
        { type: "elevator", location: [
            "地面-站厅 站厅B出入口附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端",
        ] },
    ],
    "0327": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: ["站厅层 C、D出入口附近"] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往李达方向车头",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往李达方向车头",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近（无障碍卫生间兼母婴室）",
            "站台层 开往李达方向车头（无障碍卫生间兼母婴室）",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端",
        ] },
        { type: "escalator_down", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端",
        ] },
    ],
    "0401": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 D出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 C、D出入口",
            "站厅层 站厅南侧位置附近",
        ] },
    ],
    "0402": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C 出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C出入口",
            "站厅层 站厅西侧位置附近",
        ] },
    ],
    "0403": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 A、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0404": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C1、C2出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C1出入口",
            "站厅层 站厅北侧位置附近",
        ] },
    ],
    "0405": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 C、D出入口",
            "站厅层 站厅北侧位置附近",
        ] },
    ],
    "0407": [
        { type: "service_center", location: ["站厅层 站厅中间位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往正新路方向车尾位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 B出入口附近",
            "站台层 开往正新路方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 B、D出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0408": [
        { type: "service_center", location: ["站厅层 站厅中间位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 B出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、C出入口",
            "站厅层 站厅东侧位置附近",
        ] },
    ],
    "0410": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D1、D2出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、D1出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0411": [
        { type: "service_center", location: ["站厅层 站厅中间位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
    ],
    "0413": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、D出入口对面位置",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、D出入口对面位置",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A、D出入口对面位置",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A1、A2、D1出入口",
            "设备层 设备层中部位置附近",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A1、D1出入口",
            "站厅层 站厅两端位置附近",
            "设备层 设备层中部位置附近",
        ] },
    ],
    "0414": [
        { type: "service_center", location: [
            { line: "SYM03", text: "站厅层 站厅中部" },
            { line: "SYM04", text: "站厅层 站厅中部位置" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM04", text: "站厅层 B出入口附近" },
            { line: "SYM04", text: "站厅层 D出入口附近" },
            { line: "SYM03", text: "站厅层 站厅两端" },
        ] },
        { type: "toilet", location: [
            { line: "SYM04", text: "站厅层 D出入口附近" },
            { line: "SYM03", text: "站厅层 站厅H出入口通道附近" },
            { line: "SYM03", text: "站台层 开往李达方向车头" },
            { line: "SYM04", text: "站台层 开往创新路方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM04", text: "站厅层 D出入口附近" },
            { line: "SYM03", text: "站厅层 站厅H出入口通道附近" },
            { line: "SYM03", text: "站台层 开往方家栏方向车尾附近" },
            { line: "SYM04", text: "站台层 开往创新路方向车头位置" },
        ] },
        { type: "nursing_room", location: [
            { line: "SYM04", text: "站厅层 D出入口附近" },
            { line: "SYM03", text: "站厅层 站厅H出入口通道附近；站台层 开往李达方向车头附近" },
            { line: "SYM04", text: "站台层 开往创新路方向车头位置" },
        ] },
        { type: "elevator", location: [
            { line: "SYM03", text: "地面-站厅 F出入口通往无障碍电梯通道（建设中）" },
            { line: "SYM03", text: "站厅-站台 站厅中部" },
            { line: "SYM04", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM03", text: "站厅层 F、H出入口" },
            { line: "SYM04", text: "站厅层 B、D1、D2、D出入口" },
            { line: "SYM03", text: "站台层 开往方家栏方向中部、开往方家栏方向车头附近，开往李达方向车头附近" },
            { line: "SYM04", text: "站台层 站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM04", text: "地面层 B、D2出入口" },
            { line: "SYM03", text: "站厅层 F、H出入口" },
            { line: "SYM04", text: "站厅层 站厅两端位置附近" },
            { line: "SYM03", text: "站台层 开往方家栏方向车尾附近：开往李达方向中部及车尾附近" },
        ] },
        { type: "shengjingtong", location: [{ line: "SYM04", text: "站厅层 站厅中部位置" }] },
    ],
    "0415": [
        { type: "service_center", location: ["站厅层 B、C出入口中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口中间位置",
            "站厅层 C、D出入口中间位置",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口中间位置",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口中间位置",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A、B出入口中间位置",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、C、D出入口",
            "站厅层 站厅南侧位置附近",
        ] },
    ],
    "0416": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
        { type: "shengjingtong", location: ["站厅层 站厅中部位置"] },
    ],
    "0418": [
        { type: "service_center", location: ["站厅层 站厅中部位置"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、D出入口中间位置",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、D出入口中间位置",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 A、D出入口中间位置",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅南侧位置附近",
        ] },
    ],
    "0419": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅南侧位置附近",
        ] },
    ],
    "0420": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅东侧位置附近",
        ] },
    ],
    "0421": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A、D出入口附近",
            "站厅层 B、C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 D出入口附近",
            "站台层 开往正新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅南侧位置附近",
        ] },
    ],
    "0422": [
        { type: "service_center", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
            "站厅层 沈阳南站火车站连接通道附近",
        ] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
            "站厅层 沈阳南站火车站连接通道附近",
        ] },
        { type: "toilet", location: ["站台层 开往正新路方向车头位置"] },
        { type: "accessible_toilet", location: ["站台层 开往正新路方向车头位置"] },
        { type: "nursing_room", location: ["站台层 开往正新路方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0423": [
        { type: "service_center", location: ["站厅层 站厅中部"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "nursing_room", location: [
            "站厅层 D出入口附近",
            "站台层 开往创新路方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、D出入口",
            "站厅层 站厅东侧位置附近",
        ] },
    ],
    "0901": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、D出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0902": [
        { type: "service_center", location: [
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM10", text: "站厅层 F、G出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM10", text: "站厅层 F出入口附近" },
            { line: "SYM10", text: "站厅层 E出入口附近" },
            { line: "SYM09", text: "站厅层 站厅中间位置" },
        ] },
        { type: "toilet", location: [
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM10", text: "站厅层 G出入口附近" },
            { line: "SYM10", text: "站台层 开往丁香湖方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM10", text: "站厅层 G出入口附近" },
            { line: "SYM10", text: "站台层 开往丁香湖方向车头位置" },
        ] },
        { type: "elevator", location: [
            { line: "SYM09", text: "地面-站厅 B出入口附近" },
            { line: "SYM10", text: "地面-站厅 G出入口附近" },
            { line: "SYM09", text: "站厅-站台 站厅D出入口附近" },
            { line: "SYM10", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM09", text: "站厅层 B、D出入口" },
            { line: "SYM10", text: "站厅层 E、F、G出入口" },
            { line: "SYM09", text: "站台层 站台两端和中间位置附近" },
            { line: "SYM10", text: "站台层 站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM09", text: "地面层 B、D出入口" },
            { line: "SYM10", text: "地面层 E、F、G出入口" },
            { line: "SYM09", text: "站厅层 站厅B出入口附近" },
            { line: "SYM09", text: "站厅层 站厅中部位置附近" },
            { line: "SYM10", text: "站厅层 站台两端位置附近" },
        ] },
    ],
    "0903": [
        { type: "service_center", location: ["站厅层 C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C、D出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0904": [
        { type: "service_center", location: ["站厅层 A、B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往建筑大学方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0905": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B、C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C、D出入口",
            "站台层 站台中部及两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0907": [
        { type: "service_center", location: ["站厅层 D1、D2出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 D1、D2出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 D1、D2出入口附近",
            "站台层 开往怒江公园车头方向车头位置",
            "站台层 开往建筑大学车头方向站台中部位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 D1、D2出入口附近",
            "站台层 开往怒江公园车头方向车头位置",
            "站台层 开往建筑大学车头方向站台中部位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层 D2出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 D2出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0908": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 男 、女卫生间 B出入口附近",
            "女卫生间 站台层开往建筑大学方向车头位置",
            "男卫生间 站台层开往怒江公园方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端及中部位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0909": [
        { type: "service_center", location: ["站厅层 C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 男、女卫生间 C出入口附近",
            "站台层 女卫生间开往建筑大学方向车头位置",
            "男卫生间 开往怒江公园方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往怒江公园方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0910": [
        { type: "service_center", location: ["站厅层 C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往建筑大学方向车头位置",
            "站台层 开往怒江公园方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往怒江公园方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0911": [
        { type: "service_center", location: [
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM03", text: "站厅层 站厅中部附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM09", text: "站厅层 C出入口附近" },
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM03", text: "站厅层 站厅" },
        ] },
        { type: "toilet", location: [
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM03", text: "站厅层 站厅G口附近" },
            { line: "SYM03", text: "站台层 站台开往李达方向头端门" },
            { line: "SYM09", text: "站台层 开往怒江公园方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM09", text: "站厅层 B出入口附近" },
            { line: "SYM03", text: "站厅层 站厅G口附近" },
            { line: "SYM03", text: "站台层 站台开往李达方向头端门" },
            { line: "SYM09", text: "站台层 开往怒江公园方向车头位置" },
        ] },
        { type: "nursing_room", location: [
            { line: "SYM03", text: "站厅层 站厅G口附近" },
            { line: "SYM03", text: "站台层 站台开往李达方向头端门" },
        ] },
        { type: "elevator", location: [
            { line: "SYM09", text: "地面-站厅 D出入口附近" },
            { line: "SYM03", text: "地面-站厅 F口" },
            { line: "SYM03", text: "站厅-站台 站厅中部" },
            { line: "SYM09", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM03", text: "站厅层 G、F出入口" },
            { line: "SYM09", text: "站厅层 B、C、D出入口" },
            { line: "SYM03", text: "站台层 站台两端位置附近" },
            { line: "SYM09", text: "站台层 站台两端及中部位置附近" },
            { line: "SYM03", text: "站台中部位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM09", text: "地面层 B、C、D出入口" },
            { line: "SYM03", text: "站厅层 G、F出入口" },
            { line: "SYM09", text: "站厅层 站厅两端位置附近" },
            { line: "SYM03", text: "站台层 站台两端位置附近" },
            { line: "SYM03", text: "站台中部位置附近" },
        ] },
    ],
    "0912": [
        { type: "service_center", location: ["站厅层 C、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C、D出入口",
            "站厅层 站厅北侧靠近B出入口位置附近",
        ] },
    ],
    "0913": [
        { type: "service_center", location: ["站厅层 C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A、B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、B出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、B出入口侧",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、 B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、 B、C出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "0914": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 D出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅靠近A、D口位置附近",
        ] },
    ],
    "0915": [
        { type: "service_center", location: [
            { line: "SYM09", text: "站厅层 E、H出入口附近" },
            { line: "SYM04", text: "站厅层 站厅中部附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM04", text: "站厅层 C出入口附近" },
            { line: "SYM04", text: "站厅层 A、B出入口附近" },
            { line: "SYM09", text: "站厅层 E、H出入口附近" },
            { line: "SYM09", text: "站厅层 G1出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM04", text: "站厅层 C出入口附近" },
            { line: "SYM09", text: "站厅层 G1出入口附近" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
            { line: "SYM09", text: "站台层 开往建筑大学方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM04", text: "站厅层 C出入口附近" },
            { line: "SYM09", text: "站厅层 G1出入口附近" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
            { line: "SYM09", text: "站台层 开往建筑大学方向车头位置" },
        ] },
        { type: "nursing_room", location: [
            { line: "SYM04", text: "站厅层 C出入口附近" },
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
        ] },
        { type: "elevator", location: [
            { line: "SYM04", text: "地面-站厅 B出入口附近" },
            { line: "SYM09", text: "地面-站厅 E出入口附近" },
            { line: "SYM04", text: "站厅-站台 站厅中部位置" },
            { line: "SYM09", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM04", text: "站厅层 A、B、C出入口" },
            { line: "SYM09", text: "站厅层 E、H、G1出入口" },
            { line: "SYM04", text: "站台层 站台两端及中部位置附近" },
            { line: "SYM09", text: "站台层 站台中部及站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM04", text: "地面层 A、B、C出入口" },
            { line: "SYM09", text: "地面层 E、H、G1出入口" },
            { line: "SYM04", text: "站厅层 站厅两端位置附近" },
            { line: "SYM09", text: "站厅层 站厅两端位置附近" },
        ] },
    ],
    "0916": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往建筑大学方向车头位置"] },
        { type: "accessible_toilet", location: ["站台层 开往建筑大学方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅西侧靠近B、C出入口位置附近",
        ] },
    ],
    "0917": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站台中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端及中部位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0918": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A、D出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A、D出入口附近",
            "站台层 开往建筑大学方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、D出入口",
            "站厅层 站厅靠近A、D口侧",
        ] },
    ],
    "0920": [
        { type: "service_center", location: ["站厅层 D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端及中部位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "0921": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B、C出入口附近",
            "站厅层 A、D出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往怒江公园方向车头位置"] },
        { type: "accessible_toilet", location: ["站台层 开往怒江公园方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C、D出入口",
            "站厅层 站厅西侧靠近B、C出入口位置附近",
        ] },
    ],
    "0922": [
        { type: "service_center", location: [
            { line: "SYM09", text: "站厅层 B、C出入口附近" },
            { line: "SYM10", text: "站厅层 E、F出入口附近" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM09", text: "站厅层 C出入口附近" },
            { line: "SYM09", text: "站厅层 D出入口附近" },
            { line: "SYM10", text: "站厅层 E出入口附近" },
            { line: "SYM10", text: "站厅层 A出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM09", text: "站厅层 D出入口附近" },
            { line: "SYM10", text: "站厅层 E出入口附近" },
            { line: "SYM09", text: "站台层 开往建筑大学方向车头位置" },
            { line: "SYM10", text: "站台层 开往丁香湖方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM09", text: "站厅层 D出入口附近" },
            { line: "SYM10", text: "站厅层 E出入口附近" },
            { line: "SYM10", text: "站台层 开往丁香湖方向车头位置" },
        ] },
        { type: "nursing_room", location: [{ line: "SYM09", text: "站台层 开往建筑大学方向车头位置" }] },
        { type: "elevator", location: [
            { line: "SYM09", text: "地面-站厅 B出入口附近" },
            { line: "SYM10", text: "地面-站厅 F出入口附近" },
            { line: "SYM09", text: "站厅-站台 站厅中部位置" },
            { line: "SYM10", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM09", text: "站厅层 B、C、D出入口" },
            { line: "SYM10", text: "站厅层 A、E、F出入口" },
            { line: "SYM09", text: "站台层 站台两端位置附近" },
            { line: "SYM10", text: "站台层 站台中部和站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM09", text: "地面层 B、C、D出入口" },
            { line: "SYM10", text: "地面层 A、E、F出入口" },
            { line: "SYM09", text: "站厅层 站厅两端位置附近" },
            { line: "SYM10", text: "站厅层 站厅两端位置附近" },
        ] },
    ],
    "0923": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B、C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B、C出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往怒江公园方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C、D出入口",
            "站台层 站厅中部位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C、D出入口",
            "站厅层 站厅东侧靠近D出入口位置附近",
        ] },
    ],
    "1001": [
        { type: "service_center", location: ["站厅层 C、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往丁香湖方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C、D出入口附近",
            "站台层 开往张沙布方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、D出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "1002": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往丁香湖方向车头位置"] },
        { type: "accessible_toilet", location: ["站台层 开往丁香湖方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、C出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "1003": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: ["站台层 开往丁香湖方向车头位置"] },
        { type: "accessible_toilet", location: ["站台层 开往丁香湖方向车头位置"] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "1004": [
        { type: "service_center", location: ["站厅层 D 出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往张沙布方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "elevator", location: ["站厅-站台 站厅中部位置"] },
        { type: "escalator_up", location: [
            "站厅层 C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 C、D出入口",
            "站厅层 站厅靠近C出入口附近",
        ] },
    ],
    "1006": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往丁香湖方向车头附近",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "1007": [
        { type: "service_center", location: ["站厅层 B、C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B、C出入口附近",
            "站厅层 A出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B、C出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B、C出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、C出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B出入口",
            "站厅层 站厅中部位置附近",
        ] },
        { type: "shengjingtong", location: ["A出入口附近"] },
    ],
    "1009": [
        { type: "service_center", location: ["站厅层 B、C1出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B、C1出入口附近",
            "站厅层 A出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B、C1出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B、C1出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A（出入口下段）、B（出入口下段）、C1出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A（出入口下段）、B（出入口下段）、C1出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "1010": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往张沙布方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往张沙布方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 C（出入口下段）、A出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 C（出入口下段）、A出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "1011": [
        { type: "service_center", location: [
            { line: "SYM10", text: "站厅层 D出入口附近" },
            { line: "SYM04", text: "站厅层 站厅中间位置" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM04", text: "站厅层 E出入口附近" },
            { line: "SYM04", text: "站厅层 G、F出入口附近" },
            { line: "SYM10", text: "站厅层 B出入口附近" },
            { line: "SYM10", text: "站厅层 D出入口附近" },
        ] },
        { type: "toilet", location: [
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
            { line: "SYM10", text: "站台层 开往丁香湖方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM04", text: "站台层 开往正新路方向车头位置" },
            { line: "SYM10", text: "站台层 开往丁香湖方向车头位置" },
        ] },
        { type: "nursing_room", location: [{ line: "SYM04", text: "站台层 开往正新路方向车头位置" }] },
        { type: "elevator", location: [
            { line: "SYM04", text: "地面-站厅 G出入口附近" },
            { line: "SYM04", text: "站厅-站台 站厅中部位置" },
            { line: "SYM10", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM04", text: "站厅层 E、F、G出入口" },
            { line: "SYM10", text: "站厅层 B、D出入口" },
            { line: "SYM04", text: "设备层 设备层中部位置附近" },
            { line: "SYM04", text: "站台层 站台两端及站台中部位置附近" },
            { line: "SYM10", text: "站台层 站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM04", text: "地面层 F、G出入口" },
            { line: "SYM10", text: "地面层 B出入口" },
            { line: "SYM04", text: "站厅层 站厅两端位置附近" },
            { line: "SYM10", text: "站厅层 站厅两端位置附近" },
        ] },
    ],
    "1012": [
        { type: "service_center", location: ["站厅层 C、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 C、D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往张沙布方向车尾位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往张沙布方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
        { type: "shengjingtong", location: ["站厅层 B出入口附近"] },
    ],
    "1014": [
        { type: "service_center", location: ["站厅层 A、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A、D出入口附近",
            "站厅层 B出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往张沙布方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往张沙布方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 B出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、B、D出入口",
            "站厅层 乘客服务中心附近",
        ] },
    ],
    "1015": [
        { type: "service_center", location: ["站厅层 C出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 C出入口附近",
            "站厅层 A出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 C出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 A出入口附近",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C出入口",
            "设备层 设备层中部位置附近",
            "站台层 站台中部和站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、C出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "1016": [
        { type: "service_center", location: ["站厅层 B、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B、D出入口附近",
            "站厅层 A出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B、D出入口附近",
            "站台层 开往张沙布方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B、D出入口附近",
            "站台层 开往张沙布方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、B、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B出入口",
            "站厅层 站厅中部位置附近",
        ] },
    ],
    "1017": [
        { type: "service_center", location: [
            { line: "SYM10", text: "站厅层 C、D出入口附近" },
            { line: "SYM03", text: "站厅层 站厅中部" },
        ] },
        { type: "ticket_machine", location: [
            { line: "SYM10", text: "站厅层 C出入口附近" },
            { line: "SYM10", text: "站厅层 A出入口附近" },
            { line: "SYM03", text: "站厅层 站厅两端" },
        ] },
        { type: "toilet", location: [
            { line: "SYM10", text: "站厅层 A出入口附近" },
            { line: "SYM03", text: "站厅层 换乘通道附近" },
            { line: "SYM03", text: "站台层 开往方家栏方向车头" },
            { line: "SYM10", text: "站台层 开往张沙布方向车头位置" },
        ] },
        { type: "accessible_toilet", location: [
            { line: "SYM10", text: "站厅层 A出入口附近" },
            { line: "SYM03", text: "站厅层 换乘通道旁附近" },
            { line: "SYM03", text: "站台层 开往方家栏方向车头" },
            { line: "SYM10", text: "站台层 开往张沙布方向车头位置" },
        ] },
        { type: "nursing_room", location: [
            { line: "SYM03", text: "站厅层 换乘通道附近（无障碍卫生间兼母婴室）" },
            { line: "SYM03", text: "站台层 开往方家栏方向车头附近" },
        ] },
        { type: "elevator", location: [
            { line: "SYM10", text: "地面-站厅 A出入口附近" },
            { line: "SYM03", text: "站厅-站台 站厅中部" },
            { line: "SYM10", text: "站厅-站台 站厅中部位置" },
        ] },
        { type: "escalator_up", location: [
            { line: "SYM03", text: "站厅层 E、F、G出入口" },
            { line: "SYM10", text: "站厅层 A、C、D出入口" },
            { line: "SYM03", text: "站台层 站台两端及中部" },
            { line: "SYM10", text: "站台层 站台两端位置附近" },
        ] },
        { type: "escalator_down", location: [
            { line: "SYM10", text: "地面层 A、D出入口" },
            { line: "SYM03", text: "站厅层 E、F、G出入口" },
            { line: "SYM10", text: "站厅层 站厅两端位置附近" },
            { line: "SYM03", text: "站台层 站台两端及中部" },
        ] },
    ],
    "1018": [
        { type: "service_center", location: ["站厅层 B出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 B出入口附近",
            "站厅层 D出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 B出入口附近",
            "站台层 开往张沙布方向车尾位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 C出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 B、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 B、C、D出入口",
            "站厅层 站厅两端位置附近",
        ] },
    ],
    "1020": [
        { type: "service_center", location: ["站厅层 C、D出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 A出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、C、D出入口",
            "站厅层 站厅南侧靠近C、D口乘客服务中心",
        ] },
    ],
    "1021": [
        { type: "service_center", location: ["站厅层 A出入口附近"] },
        { type: "ticket_machine", location: [
            "站厅层 A出入口附近",
            "站厅层 C出入口附近",
        ] },
        { type: "toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "accessible_toilet", location: [
            "站厅层 A出入口附近",
            "站台层 开往丁香湖方向车头位置",
        ] },
        { type: "elevator", location: [
            "地面-站厅 D出入口附近",
            "站厅-站台 站厅中部位置",
        ] },
        { type: "escalator_up", location: [
            "站厅层 A、C、D出入口",
            "站台层 站台两端位置附近",
        ] },
        { type: "escalator_down", location: [
            "地面层 A、C、D出入口",
            "站台层 开往丁香湖方向车头位置",
        ] },
    ],
};

if (typeof window !== "undefined") {
    window.SHENYANG_STATION_FACILITIES = SHENYANG_STATION_FACILITIES;
}
