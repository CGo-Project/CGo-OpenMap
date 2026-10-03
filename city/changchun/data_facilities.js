/**
 * CGo OpenMap - 长春车站设施数据
 *
 * ⚠️ 本文件由脚本生成，请勿手工编辑。生成脚本是维护者本地的开发期离线工具
 *   （不进运行时、也不入版本库）：drunk/tools/facilities/gen_changchun_facilities.js；
 *   重跑方式与转录 / 取数口径见 docs/STATION_FACILITIES_RESEARCH.md。
 *
 * 数据来源：长春轨道交通官方公众号推送的《车站设施位置一览》表格图（2025-04 发布，此后未再更新）
 *   官方没有可抓取的设施接口，故由人工转录成
 *   drunk/tools/facilities/changchun_facilities.transcript.json，再由该脚本生成此文件；
 *   转录口径（列名、格子原文、哪些列未收录）见转录件的 meta。
 *
 * 结构：本地车站 ID → 设施数组，按类型固定顺序；
 *   type     归一化类别，展示名与图标在渲染模块里
 *   location 位置段数组；**多线换乘站**的每段是 { line, text }——
 *            官方表格按线路分别给出该线站台的位置，必须能分辨是哪条线的；
 *            单线站无歧义，存纯字符串。text 是位置原文。
 *
 * 覆盖：1、2、3、4、6、8 号线的 125 座运营车站。5 号线一期 2026-09-28 才开通、
 *   7 号线与各线延伸段在源图发布时尚未运营，均无数据，这些站不渲染该模块。
 *
 * 源图是 2025-04 的静态快照且此后未更新，与现场可能不一致，展示时应注明来源。
 */
const CHANGCHUN_STATION_FACILITIES = {
    "0121": [
        { type: "toilet", location: [{ line: "CCM08", text: "换乘通道楼梯旁" }, { line: "CCM01", text: "站台层北侧" }] },
        { type: "elevator", location: [{ line: "CCM08", text: "换乘通道，站厅层中部" }, { line: "CCM01", text: "D口" }] },
        { type: "vending_drink", location: [{ line: "CCM08", text: "A、B口站厅" }, { line: "CCM01", text: "A、C口通道" }] },
        { type: "power_bank", location: [{ line: "CCM08", text: "B口站厅" }, { line: "CCM01", text: "A、C口通道" }, { line: "CCM01", text: "站厅层换乘口" }] },
        { type: "aed", location: [{ line: "CCM01", text: "长春站方向 15-16号屏蔽门中间" }] },
        { type: "photo_booth", location: [{ line: "CCM01", text: "北环8号线方向" }] },
    ],
    "0122": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["A口出站闸机旁"] },
        { type: "power_bank", location: ["A、D口通道"] },
    ],
    "0123": [
        { type: "toilet", location: ["站台层北侧", "站台层南侧(无障碍)"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["站厅近B口处"] },
        { type: "power_bank", location: ["B、D口通道"] },
    ],
    "0124": [
        { type: "toilet", location: [{ line: "CCM01", text: "站厅层进站口旁" }, { line: "CCM04", text: "站台层西侧" }] },
        { type: "elevator", location: [{ line: "CCM01", text: "B口" }, { line: "CCM04", text: "站台层铁北二路方向侧旁" }] },
        { type: "vending_drink", location: ["B口设备门口"] },
        { type: "vending_merch", location: [{ line: "CCM01", text: "B口附近" }, { line: "CCM04", text: "站厅中间" }] },
        { type: "power_bank", location: [{ line: "CCM01", text: "C口安检口 站厅中间" }, { line: "CCM04", text: "F口站厅" }] },
        { type: "aed", location: [{ line: "CCM01", text: "长春站方向 10号屏蔽门附近" }] },
    ],
    "0125": [
        { type: "toilet", location: [{ line: "CCM01", text: "站厅层A口 自动售票机旁" }, { line: "CCM03", text: "站台层东侧" }] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: [{ line: "CCM01", text: "进站后直梯附近" }, { line: "CCM03", text: "站厅内" }] },
        { type: "power_bank", location: [{ line: "CCM01", text: "A口通道" }, { line: "CCM03", text: "站厅内" }, { line: "CCM03", text: "BC口扶梯旁" }] },
        { type: "aed", location: [{ line: "CCM01", text: "红嘴子方向 9号屏蔽门附近" }] },
    ],
    "0126": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["D口通道附近"] },
        { type: "vending_merch", location: ["B口通道"] },
        { type: "power_bank", location: ["B口通道"] },
    ],
    "0127": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["A口安检附近", "C口微型消防站附近"] },
        { type: "vending_merch", location: ["A口自动售票机附近"] },
        { type: "power_bank", location: ["A口安检附近", "C口微型消防站附近"] },
        { type: "aed", location: ["长春站方向 13号屏蔽门附近"] },
    ],
    "0128": [
        { type: "toilet", location: [{ line: "CCM01", text: "站台层北侧" }, { line: "CCM02", text: "站台层两侧" }] },
        { type: "elevator", location: [{ line: "CCM01", text: "B口" }, { line: "CCM02", text: "C口" }] },
        { type: "vending_drink", location: ["A、B口通道", "D、E口通道"] },
        { type: "vending_merch", location: ["A、B口客服中心", "C、D口客服中心", "B口通道"] },
        { type: "power_bank", location: ["A、B、E口通道"] },
        { type: "aed", location: [{ line: "CCM01", text: "红嘴子方向 20号屏蔽门附近" }] },
    ],
    "0129": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: ["B、C、D口通道"] },
        { type: "vending_merch", location: ["B、C口通道"] },
        { type: "power_bank", location: ["B、C口通道"] },
        { type: "photo_booth", location: ["B口方向"] },
    ],
    "0130": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["A、C口通道"] },
        { type: "vending_merch", location: ["D口通道"] },
        { type: "power_bank", location: ["A、D口通道"] },
    ],
    "0131": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["B口通道"] },
        { type: "power_bank", location: ["B口通道"] },
    ],
    "0132": [
        { type: "toilet", location: [{ line: "CCM01", text: "站台层北侧" }, { line: "CCM03", text: "站厅层南侧" }] },
        { type: "elevator", location: [{ line: "CCM03", text: "站厅层南侧" }] },
        { type: "a11yplatform", location: [{ line: "CCM01", text: "A2口升降平台" }] },
        { type: "vending_drink", location: [{ line: "CCM01", text: "A、C口通道" }, { line: "CCM03", text: "站厅内" }] },
        { type: "vending_merch", location: [{ line: "CCM01", text: "C、D口通道" }] },
        { type: "power_bank", location: [{ line: "CCM01", text: "A、C、E换乘通道" }, { line: "CCM03", text: "站厅疏散通道口" }] },
        { type: "aed", location: [{ line: "CCM01", text: "红嘴子方向 17号屏蔽门附近" }] },
        { type: "photo_booth", location: [{ line: "CCM01", text: "D口方向" }] },
    ],
    "0133": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["A、D口通道"] },
        { type: "vending_merch", location: ["B、D口通道"] },
        { type: "power_bank", location: ["B、D口通道"] },
        { type: "aed", location: ["长春站方向 10号屏蔽门附近"] },
    ],
    "0134": [
        { type: "toilet", location: [{ line: "CCM01", text: "站台层南侧" }, { line: "CCM06", text: "站台层东侧" }] },
        { type: "nursing_room", location: [{ line: "CCM06", text: "站台层东侧" }] },
        { type: "elevator", location: [{ line: "CCM06", text: "C口" }] },
        { type: "vending_drink", location: [{ line: "CCM01", text: "A口站厅" }, { line: "CCM01", text: "B口出站闸机旁" }, { line: "CCM06", text: "C口安检处" }, { line: "CCM06", text: "换乘通道两侧" }] },
        { type: "vending_merch", location: [{ line: "CCM06", text: "C、D口安检处" }] },
        { type: "power_bank", location: [{ line: "CCM01", text: "B口出站闸机旁" }] },
        { type: "aed", location: [{ line: "CCM06", text: "双丰方向 7-8号屏蔽门之间" }] },
    ],
    "0135": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "power_bank", location: ["C口站厅附近"] },
    ],
    "0221": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: ["站厅中间"] },
        { type: "power_bank", location: ["A口通道"] },
    ],
    "0222": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "power_bank", location: ["C口通道"] },
    ],
    "0223": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "power_bank", location: ["A口通道"] },
    ],
    "0224": [
        { type: "toilet", location: [{ line: "CCM02", text: "站台层东北" }, { line: "CCM06", text: "站台层东侧" }] },
        { type: "nursing_room", location: [{ line: "CCM06", text: "站台层东侧" }] },
        { type: "elevator", location: [{ line: "CCM02", text: "B口" }, { line: "CCM06", text: "D口" }] },
        { type: "vending_drink", location: [{ line: "CCM06", text: "B通道口" }] },
        { type: "power_bank", location: [{ line: "CCM02", text: "B口通道" }] },
    ],
    "0225": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "nursing_room", location: ["站台层西侧"] },
        { type: "elevator", location: ["站厅层付费区东侧"] },
        { type: "vending_drink", location: ["站厅中间立柱旁"] },
        { type: "power_bank", location: ["站厅中间立柱旁"] },
        { type: "aed", location: ["汽车公园方向 10号屏蔽门附近"] },
    ],
    "0226": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["C口通道"] },
        { type: "power_bank", location: ["CD口通道"] },
    ],
    "0227": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["A口"] },
        { type: "vending_drink", location: ["C口通道"] },
        { type: "power_bank", location: ["A、C口通道"] },
    ],
    "0228": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["C口通道", "A、D口通道内"] },
        { type: "power_bank", location: ["C口通道", "AD口通道中间"] },
    ],
    "0229": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["D口通道", "B、C口通道内"] },
        { type: "vending_merch", location: ["B口通道"] },
        { type: "power_bank", location: ["D口通道", "BC口通道中间"] },
    ],
    "0230": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: ["A口通道", "BC口站厅"] },
        { type: "vending_merch", location: ["A口通道", "CD口站厅"] },
        { type: "power_bank", location: ["A口通道", "B口站厅"] },
    ],
    "0231": [
        { type: "toilet", location: [{ line: "CCM02", text: "站台层西侧" }] },
        { type: "elevator", location: [{ line: "CCM02", text: "站外C口" }, { line: "CCM02", text: "站内A口" }] },
        { type: "a11yplatform", location: [{ line: "CCM02", text: "DC口(升降平台)" }] },
        { type: "vending_drink", location: [{ line: "CCM02", text: "A、B口通道" }, { line: "CCM03", text: "伪满皇宫方向站台" }] },
        { type: "vending_merch", location: ["A口通道", { line: "CCM02", text: "站厅换乘通道中间" }, { line: "CCM03", text: "站厅付费区" }] },
        { type: "power_bank", location: [{ line: "CCM02", text: "站厅付费区" }, { line: "CCM02", text: "A口通道" }, { line: "CCM03", text: "D口站厅" }] },
    ],
    "0232": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: ["C、D口通道"] },
        { type: "vending_merch", location: ["C、D口通道"] },
        { type: "power_bank", location: ["C、D口通道"] },
    ],
    "0233": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["B、D口通道"] },
        { type: "vending_merch", location: ["D口通道", "车控室前"] },
        { type: "power_bank", location: ["B、C、D口通道"] },
        { type: "aed", location: ["汽车公园方向 8号屏蔽门左侧"] },
        { type: "photo_booth", location: ["D2口转角"] },
    ],
    "0235": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["A、B口通道"] },
        { type: "vending_merch", location: ["A、B口通道"] },
        { type: "power_bank", location: ["A口通道", "BC口通道中间"] },
    ],
    "0236": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: ["C口通道", "D口客服中心附近"] },
        { type: "vending_merch", location: ["D口通道"] },
        { type: "power_bank", location: ["C、D口通道"] },
        { type: "aed", location: ["东方广场方向 22号屏蔽门附近"] },
    ],
    "0237": [
        { type: "toilet", location: [{ line: "CCM02", text: "站台层西侧" }, { line: "CCM04", text: "站台层东南" }] },
        { type: "elevator", location: [{ line: "CCM02", text: "D口" }, { line: "CCM04", text: "C口、E口" }] },
        { type: "a11yplatform", location: [{ line: "CCM02", text: "CE换乘通道(升降平台)" }] },
        { type: "vending_drink", location: [{ line: "CCM02", text: "A、B口通道" }, { line: "CCM04", text: "C口站厅" }, { line: "CCM04", text: "天新路方向站台" }] },
        { type: "vending_merch", location: [{ line: "CCM02", text: "B口通道" }] },
        { type: "power_bank", location: [{ line: "CCM02", text: "A、B口通道" }, { line: "CCM02", text: "站厅内" }, { line: "CCM04", text: "长春站北方向站台" }] },
        { type: "aed", location: [{ line: "CCM02", text: "汽车公园方向 9号屏蔽门附近" }] },
        { type: "photo_booth", location: [{ line: "CCM02", text: "C口通道" }] },
    ],
    "0238": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["C2口"] },
        { type: "vending_drink", location: ["D口通道", "B、C口客服中心附近"] },
        { type: "vending_merch", location: ["B口通道"] },
        { type: "power_bank", location: ["AD通道口附近", "BC通道口附近"] },
        { type: "aed", location: ["汽车公园方向 4号屏蔽门附近"] },
    ],
    "0239": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["B口通道", "D口客服中心对面"] },
        { type: "power_bank", location: ["B口通道", "D口客服中心对面"] },
        { type: "aed", location: ["汽车公园方向 8号屏蔽门附近"] },
    ],
    "0240": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["C2C3中间"] },
        { type: "vending_drink", location: ["C口通道", "C口客服中心对面"] },
        { type: "power_bank", location: ["D口客服中心对面"] },
    ],
    "0241": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["D口通道"] },
        { type: "power_bank", location: ["A、D口通道"] },
        { type: "aed", location: ["汽车公园方向 19号屏蔽门附近"] },
    ],
    "0321": [
        { type: "toilet", location: ["站厅层和站台层北侧"] },
        { type: "elevator", location: ["B、C口", "站厅层至站台层换乘通道"] },
        { type: "vending_drink", location: ["D口站厅"] },
        { type: "power_bank", location: ["B、D口站厅"] },
        { type: "aed", location: ["C口进站闸机前方"] },
    ],
    "0322": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["站厅层中间", "BC口通道处"] },
        { type: "vending_drink", location: ["站厅内"] },
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0325": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["站厅层中间", "A口通道处"] },
        { type: "vending_drink", location: ["站台直梯旁"] },
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0326": [
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0327": [
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0328": [
        { type: "power_bank", location: ["站厅内安检旁"] },
    ],
    "0330": [
        { type: "power_bank", location: ["客服中心旁"] },
    ],
    "0331": [
        { type: "power_bank", location: ["客服中心旁"] },
    ],
    "0332": [
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0333": [
        { type: "elevator", location: ["长影世纪城方向，站厅层西南"] },
        { type: "vending_drink", location: ["双侧站台中间"] },
        { type: "power_bank", location: ["两侧站台中间", "客服中心旁"] },
    ],
    "0334": [
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0335": [
        { type: "vending_drink", location: ["长影世纪城方向、站台车尾附近"] },
        { type: "power_bank", location: ["闸机旁"] },
    ],
    "0336": [
    ],
    "0337": [
        { type: "power_bank", location: ["长影世纪城方向、客服中心旁"] },
    ],
    "0338": [
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0339": [
        { type: "power_bank", location: ["站厅内"] },
    ],
    "0341": [
        { type: "toilet", location: ["站厅层西侧"] },
        { type: "elevator", location: ["站厅层至站台层西侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["自动售票机旁"] },
    ],
    "0342": [
        { type: "toilet", location: ["站厅层西侧"] },
        { type: "elevator", location: ["站厅层西侧"] },
        { type: "power_bank", location: ["自动售票机旁"] },
    ],
    "0343": [
        { type: "toilet", location: [{ line: "CCM04", text: "站厅层付费区北侧" }, { line: "CCM03", text: "站厅层西侧" }] },
        { type: "elevator", location: [{ line: "CCM04", text: "A口" }, { line: "CCM04", text: "站厅层上下行" }, { line: "CCM04", text: "换乘通道" }, { line: "CCM03", text: "站厅层西侧" }] },
        { type: "vending_drink", location: [{ line: "CCM03", text: "两侧站台" }] },
        { type: "power_bank", location: [{ line: "CCM04", text: "两侧站台" }, { line: "CCM03", text: "客服中心对面" }] },
        { type: "photo_booth", location: [{ line: "CCM04", text: "二楼梯厅下行扶梯旁" }] },
    ],
    "0344": [
        { type: "toilet", location: ["站厅层东侧"] },
        { type: "elevator", location: ["伪满皇宫方向，站厅层西侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["自动售票机旁"] },
    ],
    "0345": [
        { type: "toilet", location: ["站厅层西侧"] },
        { type: "elevator", location: ["伪满皇宫方向，站厅层西侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["客服中心旁"] },
    ],
    "0346": [
        { type: "toilet", location: ["站厅层西侧"] },
        { type: "elevator", location: ["站厅层西侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["客服中心旁"] },
    ],
    "0347": [
        { type: "toilet", location: ["伪满皇宫方向，站台层西北"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["伪满皇宫方向站台"] },
    ],
    "0348": [
        { type: "toilet", location: ["站厅层西侧"] },
        { type: "elevator", location: ["站厅层西侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["自动售票机旁"] },
    ],
    "0349": [
        { type: "toilet", location: ["长影世纪城方向，站台层北侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["伪满皇宫方向站台"] },
    ],
    "0350": [
        { type: "toilet", location: ["站厅层西侧"] },
        { type: "elevator", location: ["站厅层北侧"] },
        { type: "power_bank", location: ["自动售票机旁"] },
    ],
    "0351": [
        { type: "toilet", location: ["站厅层北侧"] },
        { type: "elevator", location: ["站厅层西侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["伪满皇宫方向站台"] },
    ],
    "0352": [
        { type: "power_bank", location: ["客服中心旁"] },
    ],
    "0353": [
        { type: "toilet", location: ["站厅层南侧"] },
        { type: "elevator", location: ["站厅层北侧"] },
        { type: "vending_drink", location: ["伪满皇宫方向站台"] },
        { type: "power_bank", location: ["伪满皇宫方向站台"] },
    ],
    "0354": [
        { type: "toilet", location: ["伪满皇宫方向，站台层南侧"] },
        { type: "power_bank", location: ["客服中心旁"] },
    ],
    "0355": [
        { type: "toilet", location: [{ line: "CCM06", text: "站台层西侧" }, { line: "CCM03", text: "站厅层南侧" }] },
        { type: "nursing_room", location: [{ line: "CCM06", text: "双丰方向，站台层西侧" }] },
        { type: "elevator", location: [{ line: "CCM06", text: "C口" }, { line: "CCM03", text: "站厅层至站台层两侧" }] },
        { type: "vending_drink", location: [{ line: "CCM06", text: "A口通道" }, { line: "CCM06", text: "C口出站闸机旁" }, { line: "CCM03", text: "站厅内" }] },
        { type: "vending_merch", location: [{ line: "CCM06", text: "A、D口通道" }] },
        { type: "power_bank", location: [{ line: "CCM03", text: "客服中心旁" }] },
        { type: "aed", location: [{ line: "CCM06", text: "站厅中间扶梯旁" }] },
    ],
    "0422": [
        { type: "toilet", location: ["站厅层和站台层南侧"] },
        { type: "elevator", location: ["站台层至站厅层BC口方向"] },
        { type: "vending_drink", location: ["站台"] },
        { type: "power_bank", location: ["站厅"] },
    ],
    "0424": [
        { type: "toilet", location: ["站厅层北侧"] },
        { type: "elevator", location: ["站厅层北侧"] },
        { type: "vending_drink", location: ["天新路方向站台"] },
        { type: "power_bank", location: ["天新路方向站厅"] },
    ],
    "0425": [
        { type: "toilet", location: ["B口站台层北侧"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "power_bank", location: ["B口站台"] },
    ],
    "0427": [
        { type: "toilet", location: ["站台层东南"] },
        { type: "elevator", location: ["A、BC口", "A口站台层至站厅层"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0428": [
        { type: "toilet", location: ["站台层东南"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "vending_drink", location: ["站台"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0429": [
        { type: "toilet", location: ["站台层东南"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "vending_drink", location: ["长春站北方向站台"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0430": [
        { type: "toilet", location: ["站台层东南"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "vending_drink", location: ["长春站北方向站台"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0431": [
        { type: "toilet", location: ["站台层东北"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "vending_drink", location: ["长春站北方向站台"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0433": [
        { type: "toilet", location: ["A口站台层南侧"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "vending_drink", location: ["长春站北方向站台"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0434": [
        { type: "toilet", location: ["A口站台层南侧"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "vending_drink", location: ["长春站北方向站台"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0435": [
        { type: "toilet", location: ["B口站台层南侧"] },
        { type: "elevator", location: ["A口、B口"] },
        { type: "vending_drink", location: ["长春站北方向站台"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0436": [
        { type: "toilet", location: ["长春站北方向站台层（冬）", "站厅层付费区（夏）"] },
        { type: "elevator", location: ["站厅层两侧", "站台层中间"] },
        { type: "vending_drink", location: ["长春站北方向站台"] },
        { type: "power_bank", location: ["站厅"] },
    ],
    "0437": [
        { type: "toilet", location: [{ line: "CCM04", text: "E口站厅付费区右侧" }, { line: "CCM06", text: "站台层南侧" }] },
        { type: "nursing_room", location: [{ line: "CCM06", text: "站台层南侧" }] },
        { type: "elevator", location: [{ line: "CCM04", text: "E、DC口付费区通往天桥楼梯" }, { line: "CCM06", text: "C口" }] },
        { type: "vending_drink", location: ["A、B口通道"] },
        { type: "vending_merch", location: [{ line: "CCM06", text: "B口" }] },
        { type: "power_bank", location: ["D口换乘通道内"] },
        { type: "aed", location: [{ line: "CCM04", text: "E口进站后站厅层内" }] },
    ],
    "0438": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["A2口、B2口"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0439": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["A1口、B1口"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0440": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["A1口、B1口"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0441": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["A1口、B1口"] },
        { type: "power_bank", location: ["长春站北方向站台"] },
    ],
    "0623": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["B口通道"] },
    ],
    "0624": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["CD口通道"] },
    ],
    "0625": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "nursing_room", location: ["站台层北侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: ["B、F口通道"] },
        { type: "vending_merch", location: ["B口通道"] },
    ],
    "0626": [
        { type: "toilet", location: ["站台层南侧"] },
        { type: "nursing_room", location: ["站台层南侧"] },
        { type: "elevator", location: ["B口"] },
        { type: "vending_drink", location: ["A、B口出站闸机旁"] },
        { type: "vending_merch", location: ["B口安检旁", "CD口通道"] },
        { type: "aed", location: ["站台直梯旁"] },
        { type: "photo_booth", location: ["C口通道"] },
    ],
    "0627": [
        { type: "toilet", location: ["站台层东北侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["A、CD口出站闸机旁附近"] },
        { type: "vending_merch", location: ["A、CD口出站闸机附近"] },
    ],
    "0628": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "nursing_room", location: ["站台层北侧"] },
        { type: "elevator", location: ["A口"] },
        { type: "vending_drink", location: ["A、F口通道"] },
        { type: "vending_merch", location: ["A、F口通道", "车控室前"] },
    ],
    "0629": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "nursing_room", location: ["站台层北侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["B、D口通道"] },
        { type: "vending_merch", location: ["A、D通道口"] },
    ],
    "0630": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "elevator", location: ["A口"] },
        { type: "vending_drink", location: ["A、C口通道"] },
        { type: "vending_merch", location: ["C口通道口"] },
    ],
    "0631": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["B、D口通道"] },
        { type: "vending_merch", location: ["B口通道"] },
    ],
    "0632": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "nursing_room", location: ["站台层东侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["A、B1口通道"] },
        { type: "vending_merch", location: ["B口通道"] },
    ],
    "0633": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["D口通道", "CD口出站闸机旁"] },
    ],
    "0635": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["A口"] },
        { type: "vending_drink", location: ["D口通道", "A口出站闸机旁"] },
        { type: "vending_merch", location: ["D口出站闸机处"] },
    ],
    "0637": [
        { type: "toilet", location: ["站台层北侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["B口通道", "CD口通道"] },
    ],
    "0638": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["D口"] },
        { type: "vending_drink", location: ["A口通道旁", "B口通道"] },
    ],
    "0639": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["B、D口通道"] },
        { type: "vending_merch", location: ["D口通道"] },
    ],
    "0640": [
        { type: "toilet", location: ["站台层东侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["A、C口通道"] },
    ],
    "0641": [
        { type: "toilet", location: ["站台层西侧"] },
        { type: "elevator", location: ["C口"] },
        { type: "vending_drink", location: ["C、D口通道"] },
        { type: "vending_merch", location: ["C、D通道"] },
    ],
    "0822": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["A、B口站厅"] },
        { type: "power_bank", location: ["B口站厅"] },
    ],
    "0823": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["B口站厅"] },
        { type: "power_bank", location: ["B口站厅"] },
    ],
    "0824": [
        { type: "toilet", location: ["站厅层B口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["B口站厅"] },
        { type: "power_bank", location: ["B口站厅"] },
    ],
    "0825": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["站台层换乘通道"] },
        { type: "vending_drink", location: ["A口站厅"] },
        { type: "power_bank", location: ["A口站厅"] },
    ],
    "0826": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["站厅层中部"] },
        { type: "vending_drink", location: ["A口站厅"] },
        { type: "power_bank", location: ["A口站厅"] },
    ],
    "0827": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["A、B口站厅"] },
        { type: "power_bank", location: ["B口站厅"] },
    ],
    "0828": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["A、B口站厅"] },
        { type: "power_bank", location: ["B口站厅"] },
    ],
    "0829": [
        { type: "toilet", location: ["站厅层B口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["A、B口站厅"] },
        { type: "power_bank", location: ["A口站厅"] },
    ],
    "0830": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["A、B口站厅"] },
        { type: "power_bank", location: ["B口站厅"] },
    ],
    "0831": [
        { type: "toilet", location: ["站厅层B口"] },
        { type: "elevator", location: ["A、B口"] },
        { type: "vending_drink", location: ["A、B口站厅"] },
        { type: "power_bank", location: ["B口站厅"] },
    ],
    "0832": [
        { type: "toilet", location: ["站厅层A口"] },
        { type: "elevator", location: ["站厅层中部"] },
        { type: "vending_drink", location: ["A口站厅"] },
        { type: "power_bank", location: ["A口站厅"] },
    ],
};

window.CHANGCHUN_STATION_FACILITIES = CHANGCHUN_STATION_FACILITIES;
