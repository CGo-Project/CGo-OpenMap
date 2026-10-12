/**
 * CGo OpenMap - 大连车站设施数据
 *
 * ⚠️ 本文件由脚本生成，请勿手工编辑。生成脚本是维护者本地的开发期离线工具
 *   （不进运行时、也不入版本库）：drunk/tools/facilities/fetch_dalian_facilities.js；
 *   重跑方式与取数口径见 docs/STATION_FACILITIES_RESEARCH.md。
 *
 * 数据来源：大连公共交通建设投资集团官网站点接口
 *   POST https://www.dltransgrp.com/hb-air-api/site/getDefaultMetroLine.do
 * 采集口径与清洗规则见 docs/STATION_FACILITIES_RESEARCH.md 与脚本头部注释。
 *
 * 结构：本地车站 ID → 设施数组，按官网字段顺序；
 *   type     归一化类别，展示名与图标在渲染模块里
 *   location 位置段数组；**多线换乘站**的每段是 { line, text }——
 *            官网两条线各自描述同一座车站的站台，必须能分辨是哪条线的；
 *            单线站无歧义，存纯字符串。text 是位置原文。
 * 未收录的车站（国铁、有轨电车等官网不覆盖的线路）不渲染该模块。
 *
 * 官网数据非实时同步，与现场可能不一致，展示时应注明来源。
 */
const DALIAN_STATION_FACILITIES = {
    "0101": [
        { type: "toilet", location: [
            "姚家→河口车头方向",
            "河口→姚家车尾方向",
        ] },
        { type: "accessible_toilet", location: ["姚家→河口车头方向"] },
        { type: "recharge_machine", location: ["站厅靠近A口位置"] },
        { type: "elevator", location: ["站内:付费区-站厅与站台中间位置 无"] },
    ],
    "0102": [
        { type: "toilet", location: [
            { text: "站厅：员工区左侧罗森便利店旁" },
            { line: "DLM01", text: "站台：河口→姚家方向车头" },
            { line: "DLM02", text: "站台 海之韵→大连北站方向车头" },
        ] },
        { type: "recharge_machine", location: [
            { text: "站厅综控室玻璃右侧" },
            { text: "C口右侧墙边" },
        ] },
        { type: "elevator", location: [
            { line: "DLM01", text: "站内:付费区-站厅与站台中间位置" },
            { text: "站外:A1口" },
        ] },
    ],
    "0103": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近C口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:B口",
        ] },
    ],
    "0104": [
        { type: "toilet", location: ["河口→姚家方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近D口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0105": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: [
            "站厅靠近B口",
            "D口位置",
        ] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C口",
        ] },
    ],
    "0106": [
        { type: "toilet", location: ["河口→姚家方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近D口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0107": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近A、D口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0108": [
        { type: "toilet", location: [
            "河口→姚家方向车尾",
            "姚家→河口方向车头",
        ] },
        { type: "accessible_toilet", location: ["河口→姚家方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近B口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0109": [
        { type: "toilet", location: ["河口→姚家方向车尾"] },
        { type: "recharge_machine", location: ["站厅A口直梯旁"] },
        { type: "elevator", location: [
            "站内:非付费区-靠近A口进站闸机位置",
            "站外:A2口",
        ] },
    ],
    "0110": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近D口位置"] },
        { type: "elevator", location: [
            "站内：非付费区-靠近B口进站闸机位置",
            "站外：C口",
        ] },
    ],
    "0111": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: ["站厅B口自动售票机旁"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C2口",
        ] },
    ],
    "0112": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近C口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0113": [
        { type: "toilet", location: [
            { line: "DLM01", text: "河口→姚家方向车头" },
            { line: "DLM02", text: "机场→海之韵方向车头" },
        ] },
        { type: "recharge_machine", location: [
            { text: "站厅综控室前" },
            { text: "站厅A口旁" },
            { text: "站厅靠近B口位置" },
        ] },
        { type: "elevator", location: [
            { text: "站内:非付费区-靠近A、D口出站闸机位置" },
            { text: "站外:D口" },
            { text: "站内:非付费区-靠近A、C口出站闸机位置" },
        ] },
    ],
    "0114": [
        { type: "toilet", location: ["姚家→河口方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近C口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:B口",
        ] },
    ],
    "0115": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近B口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:B口",
        ] },
    ],
    "0116": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近A口位置"] },
        { type: "elevator", location: [
            "站内：非付费区-靠近A口出站闸机位置",
            "站外：星雨街",
        ] },
    ],
    "0117": [
        { type: "toilet", location: ["河口→姚家方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近B口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:B口",
        ] },
    ],
    "0118": [
        { type: "toilet", location: ["河口→姚家方向车头"] },
        { type: "recharge_machine", location: [
            "站厅靠近A口位置",
            "站厅靠近B口位置",
        ] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0119": [
        { type: "toilet", location: [
            "姚家→河口方向车头",
            "A口和D口中间客服旁边",
        ] },
        { type: "recharge_machine", location: ["站厅靠近A、D口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C口",
        ] },
    ],
    "0120": [
        { type: "toilet", location: [
            "公共卫生间姚家→河口方向车尾",
            "残卫河口→姚家方向车头",
        ] },
        { type: "recharge_machine", location: [
            "站厅靠近D口位置",
            "站厅C口自动售票机处",
        ] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C口",
        ] },
    ],
    "0121": [
        { type: "toilet", location: ["姚家→河口方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近B口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C口",
        ] },
    ],
    "0201": [
        { type: "toilet", location: ["海之韵→大连北站方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近B、C口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0202": [
        { type: "toilet", location: [
            "南厅各一个",
            "北厅各一个",
        ] },
        { type: "recharge_machine", location: ["北厅自动售票机旁"] },
        { type: "elevator", location: ["站外:A、C口"] },
    ],
    "0203": [
        { type: "toilet", location: [
            "南厅各一个",
            "北厅各一个",
        ] },
        { type: "recharge_machine", location: ["北厅自动售票机旁"] },
        { type: "elevator", location: ["站外:A、C口"] },
    ],
    "0204": [
        { type: "toilet", location: [
            "南厅各一个",
            "北厅各一个",
        ] },
        { type: "recharge_machine", location: ["站厅靠近A、B口位置"] },
        { type: "elevator", location: ["站外:A、C口"] },
    ],
    "0205": [
        { type: "toilet", location: ["海之韵→大连北站方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近D口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0206": [
        { type: "toilet", location: ["海之韵→大连北站方向车尾"] },
        { type: "recharge_machine", location: [
            "站厅靠近B口",
            "D口位置",
        ] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0207": [
        { type: "toilet", location: ["海之韵→大连北站方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近A口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0208": [
        { type: "toilet", location: [
            { line: "DLM02", text: "海之韵→大连北站方向车头" },
            { line: "DLM05", text: "站台层端门附近" },
        ] },
        { type: "recharge_machine", location: [
            { line: "DLM02", text: "站厅靠近E口位置" },
            { line: "DLM02", text: "站厅C口通道边" },
        ] },
        { type: "elevator", location: [
            { line: "DLM02", text: "站内:付费区-站厅与站台中间位置" },
            { line: "DLM05", text: "站外电梯：A口旁1台，站厅与站台中间位置1台 换乘通道1台" },
            { line: "DLM02", text: "站外:A口" },
        ] },
    ],
    "0209": [
        { type: "toilet", location: ["海之韵→大连北站方向车头"] },
        { type: "recharge_machine", location: [
            "站厅A、B口位置一台",
            "站厅C口旁一台",
        ] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0210": [
        { type: "toilet", location: ["海之韵→大连北站方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近A、D口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0211": [
        { type: "toilet", location: ["海之韵→大连北站方向车尾"] },
        { type: "recharge_machine", location: ["站厅B口附近"] },
        { type: "elevator", location: [
            "站内:付费区-靠近A口进站闸机位置",
            "站外:A口",
        ] },
    ],
    "0212": [
        { type: "toilet", location: ["海之韵→大连北站方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近A口位置"] },
        { type: "elevator", location: ["站外:C口"] },
    ],
    "0213": [
        { type: "toilet", location: ["大连北站→海之韵方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近A口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0214": [
        { type: "toilet", location: ["大连北站→海之韵方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近C口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C口",
        ] },
    ],
    "0215": [
        { type: "toilet", location: ["海之韵→大连北站方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近C口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C口",
        ] },
    ],
    "0216": [
        { type: "toilet", location: ["大连北站→海之韵方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近B口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:C口",
        ] },
    ],
    "0217": [
        { type: "toilet", location: ["海之韵→大连北站方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近A口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:D口",
        ] },
    ],
    "0218": [
        { type: "toilet", location: ["海之韵→大连北站方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近A口位置"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0219": [
        { type: "toilet", location: ["大连北站→海之韵方向车尾"] },
        { type: "recharge_machine", location: ["站厅靠近A口出站闸机"] },
        { type: "elevator", location: [
            "站内:付费区-站厅与站台中间位置",
            "站外:A口",
        ] },
    ],
    "0220": [
        { type: "toilet", location: ["海之韵→大连北站方向车头"] },
        { type: "recharge_machine", location: ["站厅靠近B,D位置"] },
        { type: "elevator", location: [
            "站内付费区，站厅与站台中间位置",
            "站外C,D",
        ] },
    ],
    "0221": [
        { type: "toilet", location: ["位于海之韵→大连北站方向车尾"] },
        { type: "elevator", location: [
            "站内电梯位于付费区内，站厅与站台中间位置",
            "站外电梯：C口",
        ] },
    ],
    "0222": [
        { type: "toilet", location: ["位于海之韵→大连北站方向车头"] },
        { type: "elevator", location: [
            "站内电梯位于付费区内，站厅与站台中间位置",
            "站外电梯：B口",
        ] },
    ],
    "0223": [
        { type: "toilet", location: ["大连北站→海之韵方向车尾"] },
        { type: "elevator", location: [
            "站内电梯位于付费区内，站厅与站台中间位置",
            "站外电梯：C口",
        ] },
    ],
    "0224": [
        { type: "toilet", location: ["位于海之韵→大连北站方向车头"] },
        { type: "elevator", location: [
            "站内电梯位于付费区内，站厅与站台中间位置",
            "站外电梯：A口",
        ] },
    ],
    "0225": [
        { type: "toilet", location: ["位于海之韵→大连北站方向车头"] },
        { type: "elevator", location: [
            "站内电梯位于付费区内，站厅与站台中间位置",
            "站外电梯:C口",
        ] },
    ],
    "0226": [
        { type: "toilet", location: ["位于海之韵→大连北站方向车头"] },
        { type: "elevator", location: [
            "站内电梯位于付费区内，站厅与站台中间位置",
            "站外电梯:A口",
        ] },
    ],
    "0227": [
        { type: "toilet", location: ["位于海之韵→大连北站方向车尾"] },
        { type: "elevator", location: [
            "站内电梯位于付费区内，站厅与站台中间位置",
            "站外电梯：B口",
        ] },
    ],
    "0301": [
        { type: "toilet", location: [
            { line: "DLM03", text: "北厅付费区进站闸机对面" },
            { line: "DLM03", text: "南厅付费区出站闸机对面" },
            { line: "DLM05", text: "站台层端门附近" },
        ] },
        { type: "recharge_machine", location: [
            { line: "DLM03", text: "站厅西出入口旁" },
            { line: "DLM03", text: "站厅东出入口旁" },
        ] },
        { type: "elevator", location: [
            { line: "DLM03", text: "付费区-南厅" },
            { line: "DLM05", text: "站外电梯：G1口旁1台，站厅与站台中间位置1台" },
        ] },
    ],
    "0302": [
        { type: "toilet", location: ["站西厅大连方向楼梯旁"] },
        { type: "recharge_machine", location: ["站厅非付费区中央"] },
        { type: "elevator", location: ["付费区-东厅"] },
    ],
    "0303": [
        { type: "toilet", location: ["站厅靠近出入口处"] },
        { type: "recharge_machine", location: ["站厅补票室旁"] },
    ],
    "0304": [
        { type: "toilet", location: ["站厅付费区出站闸机旁"] },
        { type: "recharge_machine", location: ["站厅出入口处"] },
    ],
    "0305": [
        { type: "toilet", location: [
            { line: "DLM03", text: "站厅南出入口处" },
            { line: "DLM05", text: "站台层端门附近" },
        ] },
        { type: "recharge_machine", location: [{ line: "DLM03", text: "站厅北出入口处" }] },
        { type: "elevator", location: [{ line: "DLM05", text: "站外电梯：D口旁1台，站厅与站台中间位置1台" }] },
    ],
    "0306": [
        { type: "toilet", location: ["站厅靠近出入口处"] },
        { type: "recharge_machine", location: ["站厅南门门口旁"] },
    ],
    "0307": [
        { type: "toilet", location: ["站西厅大连方向楼梯旁"] },
        { type: "recharge_machine", location: [
            "站东厅出入口处",
            "站西厅出入口处",
        ] },
    ],
    "0308": [
        { type: "toilet", location: [
            { text: "站西厅大连方向楼梯旁" },
            { text: "付费区内" },
        ] },
        { type: "recharge_machine", location: [
            { text: "站西厅出入口旁" },
            { text: "站厅" },
        ] },
        { type: "elevator", location: [{ text: "付费区-东厅" }] },
    ],
    "0309": [
        { type: "toilet", location: ["站西厅大连方向楼梯旁"] },
        { type: "recharge_machine", location: ["站厅北出入口处"] },
    ],
    "0310": [
        { type: "toilet", location: ["大连→金石滩方向车头"] },
        { type: "recharge_machine", location: [
            "站北厅靠近补票室",
            "站南厅靠近补票室",
        ] },
    ],
    "0311": [
        { type: "toilet", location: ["大连→金石滩方向车头"] },
        { type: "recharge_machine", location: ["站南厅靠近进站闸机"] },
    ],
    "0313": [
        { type: "toilet", location: [
            "金石滩→大连方向车头",
            "大连→金石滩方向车尾",
        ] },
        { type: "recharge_machine", location: ["站北厅售票室对面"] },
    ],
    "0315": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["站厅东出入口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "0316": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅补票室旁"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "0317": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅安检口旁"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "0318": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅安检口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "0319": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅安检口旁"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "0320": [
        { type: "toilet", location: [{ text: "二楼站厅员工通道入口处" }] },
        { type: "recharge_machine", location: [{ text: "二楼站厅靠近西门" }] },
        { type: "elevator", location: [
            { text: "站厅非付费区-一楼至2楼站厅" },
            { line: "DLM99", text: "站厅付费区-上下行站台" },
            { line: "DLM13", text: "站厅付费区-上下行站台" },
        ] },
    ],
    "0501": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：C口旁1台，站厅与站台中间位置1台"] },
    ],
    "0502": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：C口旁1台，站厅与站台中间位置1台"] },
    ],
    "0503": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：C口旁1台，站厅与站台中间位置3台"] },
    ],
    "0504": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：D口旁1台，站厅与站台中间位置1台"] },
    ],
    "0505": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：C口旁1台，站厅与站台中间位置1台"] },
    ],
    "0506": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：B口旁1台，站厅与站台中间位置1台"] },
    ],
    "0507": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：B口旁1台，站厅与站台中间位置1台"] },
    ],
    "0510": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：A口旁1台，站厅与站台中间位置2台"] },
    ],
    "0511": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：A口旁1台，站厅与站台中间位置1台"] },
    ],
    "0512": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：B口旁1台，站厅与站台中间位置1台"] },
    ],
    "0513": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：D口旁1台，站厅与站台中间位置1台"] },
    ],
    "0514": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：D口旁1台, 站厅与站台中间位置1台"] },
    ],
    "0515": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：B口旁1台，站厅与站台中间位置1台"] },
    ],
    "0516": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：B口旁1台，站厅与站台中间位置1台"] },
    ],
    "0518": [
        { type: "toilet", location: ["站台层端门附近"] },
        { type: "elevator", location: ["站外电梯：C口旁1台，站厅与站台中间位置2台"] },
    ],
    "0801": [
        { type: "toilet", location: [
            { text: "站厅" },
            { text: "付费区内" },
            { line: "DLM01", text: "旅顺新港方向站台" },
            { line: "DLM01", text: "姚家方向站台" },
        ] },
        { type: "recharge_machine", location: [
            { text: "站厅靠近C口位置" },
            { text: "站厅" },
        ] },
        { type: "elevator", location: [
            { line: "DLM01", text: "站内:付费区-站厅与站台中间位置" },
            { text: "站外:B口" },
        ] },
    ],
    "0802": [
        { type: "toilet", location: ["付费区内站厅员工区通道门口"] },
        { type: "recharge_machine", location: ["站厅靠近南门附近"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "0803": [
        { type: "toilet", location: ["付费区内站厅员工区通道门口"] },
        { type: "recharge_machine", location: ["站厅靠近南门附近"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "0804": [
        { type: "toilet", location: ["付费区内二楼站厅"] },
        { type: "recharge_machine", location: ["二楼站厅正对楼梯处"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "0805": [
        { type: "toilet", location: ["付费区内站厅员工区通道门口"] },
        { type: "recharge_machine", location: ["站厅靠近东门门口"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "0806": [
        { type: "toilet", location: ["付费区内站厅员工区通道门口"] },
        { type: "recharge_machine", location: ["站厅南侧"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "0807": [
        { type: "toilet", location: ["付费区内站厅警务室门对面"] },
        { type: "recharge_machine", location: ["站厅客服中心玻璃对面"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "0808": [
        { type: "toilet", location: ["付费区内站厅警务室门对面"] },
        { type: "recharge_machine", location: ["站厅安检机旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "1321": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["站厅东出入口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "1322": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅靠近西门"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "1324": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["站厅东出入口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "1327": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅靠近西门"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "1328": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["站厅东出入口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "1329": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅靠近西门"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "1331": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["站厅东出入口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "1332": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅靠近西门"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "1333": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["站厅东出入口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
    "1334": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["二楼站厅靠近西门"] },
        { type: "elevator", location: [
            "站厅非付费区-一楼至2楼站厅",
            "站厅付费区-上下行站台",
        ] },
    ],
    "1336": [
        { type: "toilet", location: ["二楼站厅员工通道入口处"] },
        { type: "recharge_machine", location: ["站厅东出入口旁"] },
        { type: "elevator", location: ["站厅付费区-上下行站台"] },
    ],
};

if (typeof window !== "undefined") {
    window.DALIAN_STATION_FACILITIES = DALIAN_STATION_FACILITIES;
}
