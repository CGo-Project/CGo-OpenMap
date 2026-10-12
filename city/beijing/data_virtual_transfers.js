/**
 * CGo OpenMap - 虚拟换乘与出站连通配置 (city/beijing/data_virtual_transfers.js)
 * 
 * ==============================================================================
 * 虚拟换乘数据规范说明 (Virtual Transfers Specifications)
 * ==============================================================================
 * 
 * 1. 免费虚拟换乘映射表 (VIRTUAL_FREE_TRANSFER_MAP):
 *    - 作用：定义出站限时免费换乘关系（如同一站名不同站厅，或临近两座车站互通）。
 *    - 格式：双向字典，键为车站 ID，值为可连通的对应车站 ID 数组。
 * 
 * 2. 免费虚拟换乘连线数组 (VIRTUAL_FREE_CONNECT_LINES):
 *    - 作用：在地图画布上绘制连接两站的免费换乘连通虚线。
 *    - 格式：{ from: "车站ID1", to: "车站ID2", offsetFrom: {x, y}, offsetTo: {x, y} }
 * 
 * 3. 付费/国铁虚拟换乘映射表 (VIRTUAL_TRANSFER_MAP):
 *    - 作用：定义非免费的站外换乘或国铁火车站接驳换乘关系。
 * 
 * 4. 付费/国铁虚拟换乘连线数组 (VIRTUAL_CONNECT_LINES):
 *    - 作用：在地图画布上绘制连接两站的常规换乘连通虚线。
 * 
 * ️ 移植指南 (Porting Guide):
 * 如果目标城市不存在站外虚拟换乘，可将字典和数组保留为空对象 `{}` 或空数组 `[]`。
 * ==============================================================================
 */

// 免费虚拟换乘/站外换乘映射表
const VIRTUAL_FREE_TRANSFER_MAP = {
    //大钟寺
    "M1302": ["M1206"],
    "M1206": ["M1302"],

    //木樨地
    "M1619": ["M111"],
    "M111": ["M1619"],

    //复-太
    "M1905": ["M113"],
    "M113": ["M1905"],

    //广-牛
    "M1906": ["M704"],
    "M704": ["M1906"],
};

const VIRTUAL_FREE_CONNECT_LINES = [
    {//大钟寺
        from: "M1302", 
        to: "M1206",
        offsetFrom: { x: 0, y: 0 },
        offsetTo: { x: 0, y: 0 }
    },
    {//木樨地
        from: "M111", 
        to: "M1619",
        offsetFrom: { x: 0, y: 0 },
        offsetTo: { x: 0, y: 0 }
    },
    {//复-太
        from: "M113", 
        to: "M1905",
        offsetFrom: { x: 0, y: 0 },
        offsetTo: { x: 0, y: 0 }
    },
    {//广-牛
        from: "M704", 
        to: "M1906",
        offsetFrom: { x: 0, y: 0 },
        offsetTo: { x: 0, y: 0 }
    },
];

// 付费虚拟换乘/站外换乘映射表
const VIRTUAL_TRANSFER_MAP = {
    //黄村-大兴
    "Rwy01": ["M432"],
    "M432": ["Rwy01"],

    //北运河东-副中心
    "Rwy02": ["M632"],
    "M632": ["Rwy02"],

    //巴沟
    "XJ06": ["M1001"],
    "M1001": ["XJ06"],

    //荣昌
    "T105": ["M2409"],
    "M2409": ["T105"],

    //丽泽
    "DAE1": ["M1409"],
    "M1409": ["DAE1"],

    //草桥
    "DAE2": ["M1032"],
    "M1032": ["DAE2"],

    //北新桥
    "CAE1": ["M513"],
    "M513": ["CAE1"],

    //东直门
    "CAE2": ["M206"],
    "M206": ["CAE2"],

    //三元桥
    "CAE3": ["M1014"],
    "M1014": ["CAE3"],

    //北京西
    "S102": ["M701"],
    "M701": ["S102"],

    //北京
    "S103": ["M210"],
    "M210": ["S103"],

    //后吕村
    "S108": ["M142"],
    "M142": ["S108"],

    //北京北
    "S501": ["M201"],
    "M201": ["S501"],

    //清河
    "S502": ["M1306"],
    "M1306": ["S502"],

    //通州西
    "S601": ["M129", "M130"],
    "M129": ["S601"],
    "M130": ["S601"],

    //顺义
    "S602": ["M1518"],
    "M1518": ["S602"],

    //怀柔北
    "S505": ["S607"],
    "S607": ["S505"],

    //雁栖湖
    "S504": ["S606"],
    "S606": ["S504"],
};

const VIRTUAL_CONNECT_LINES = [
   {//黄村-大兴
        from: "Rwy01", 
        to: "M432",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//北运河东-副中心
        from: "Rwy02", 
        to: "M632",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//巴沟
        from: "XJ06", 
        to: "M1001",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//荣昌
        from: "T105", 
        to: "M2409",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//丽泽
        from: "M1409", 
        to: "DAE1",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//草桥
        from: "M1032", 
        to: "DAE2",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//北新桥
        from: "M513", 
        to: "CAE1",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//东直门
        from: "M206", 
        to: "CAE2",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//三元桥
        from: "M1014", 
        to: "CAE3",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//北京西
        from: "M701", 
        to: "S102",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//北京
        from: "M210", 
        to: "S103",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//北京北
        from: "M201", 
        to: "S501",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//清河
        from: "M1306", 
        to: "S502",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//八里桥
        from: "M129", 
        to: "S601",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//通州北苑
        from: "M130", 
        to: "S601",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//顺义
        from: "M1518", 
        to: "S602",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//怀柔北
        from: "S505", 
        to: "S607",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {//雁栖湖
        from: "S504", 
        to: "S606",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
];