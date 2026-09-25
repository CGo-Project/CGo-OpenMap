/**
 * CGo OpenMap - 长春官方线路图站点数据
 *
 * 来源：长春轨道交通官方交互线路图脚本 ccmtr.js。坐标为按等比缩放后的示意图坐标，
 * 仅用于线路图排版，不代表地理坐标或真实站间里程。换乘站统一使用单一站点节点，
 * 所有站名标签偏移量已重置为 0，保留原有对齐方向。
 */

const stationsData = {
    "0121": {
        "type": "tsf",
        "x": 1080,
        "y": 276,
        "cn": "北环城路",
        "en": "Beihuanchenglu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0122": {
        "type": "dot",
        "x": 1080,
        "y": 360,
        "cn": "庆丰路",
        "en": "Qingfeng Lu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0123": {
        "type": "dot",
        "x": 1080,
        "y": 444,
        "cn": "一匡街",
        "en": "Yikuang Jie",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0124": {
        "type": "tsf",
        "x": 1080,
        "y": 500,
        "cn": "长春站北",
        "en": "Changchunzhan Bei",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0125": {
        "type": "tsf",
        "x": 1080,
        "y": 584,
        "cn": "长春站",
        "en": "Changchun Zhan",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0126": {
        "type": "dot",
        "x": 1080,
        "y": 668,
        "cn": "胜利公园",
        "en": "Shengli Gongyuan",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0127": {
        "type": "dot",
        "x": 1080,
        "y": 752,
        "cn": "人民广场",
        "en": "Renmin Guangchang",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0127-1": {
        "type": "no",
        "hideLabel": true,
        "x": 1080,
        "y": 752,
        "cn": "人民广场",
        "en": "Renmin Guangchang",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0128": {
        "type": "tsf",
        "x": 1080,
        "y": 864,
        "cn": "解放大路",
        "en": "Jiefang Dalu",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0129": {
        "type": "dot",
        "x": 1080,
        "y": 962,
        "cn": "东北师大",
        "en": "Dongbei Shida",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0130": {
        "type": "tsf",
        "x": 1080,
        "y": 1088,
        "cn": "工农广场",
        "en": "Gongnong Guangchang",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0131": {
        "type": "dot",
        "x": 1080,
        "y": 1158,
        "cn": "繁荣路",
        "en": "Fanrong Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0132": {
        "type": "tsf",
        "x": 1080,
        "y": 1256,
        "cn": "卫星广场",
        "en": "Weixing Guangchang",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0133": {
        "type": "dot",
        "x": 1080,
        "y": 1340,
        "cn": "市政府",
        "en": "Shizhengfu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0134": {
        "type": "tsf",
        "x": 1080,
        "y": 1424,
        "cn": "华庆路",
        "en": "Huaqing Lu",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0135": {
        "type": "dot",
        "x": 1080,
        "y": 1508,
        "cn": "红嘴子",
        "en": "Hongzuizi",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0136": {
        "type": "no",
        "x": 1080,
        "y": 1664,
        "cn": "红石",
        "en": "Hongshi",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0137": {
        "type": "no",
        "x": 1080,
        "y": 1760,
        "cn": "兴创路(国际博览中心北)",
        "en": "Xingchuang Lu (Guoji Bolan Zhongxin Bei)",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0138": {
        "type": "no",
        "x": 1080,
        "y": 1800,
        "cn": "兴博路(国际博览中心南)",
        "en": "Xingbo Lu (Guoji Bolan Zhongxin Nan)",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0139": {
        "type": "no",
        "x": 1080,
        "y": 1860,
        "cn": "兴启路(国医中心)",
        "en": "Xingqi Lu (Guoyi Zhongxin)",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0221": {
        "type": "tsf",
        "x": 100,
        "y": 1088,
        "cn": "汽车公园",
        "en": "Qiche Gongyuan",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0222": {
        "type": "dot",
        "x": 100,
        "y": 1009,
        "cn": "捷达大路",
        "en": "Jieda Dalu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0223": {
        "type": "dot",
        "x": 100,
        "y": 930,
        "cn": "西湖",
        "en": "Xihu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0224": {
        "type": "tsf",
        "x": 184,
        "y": 869,
        "cn": "双丰",
        "en": "Shuangfeng",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 8
        }
    },
    "0225": {
        "type": "tsf",
        "x": 268,
        "y": 869,
        "cn": "长春西站",
        "en": "Changchunxi Zhan",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -32
        }
    },
    "0226": {
        "type": "dot",
        "x": 380,
        "y": 864,
        "cn": "兴隆堡",
        "en": "Xinglongpu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0227": {
        "type": "dot",
        "x": 464,
        "y": 864,
        "cn": "西环城路",
        "en": "Xihuanchenglu",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0228": {
        "type": "dot",
        "x": 548,
        "y": 864,
        "cn": "和平大街",
        "en": "Heping Dajie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0229": {
        "type": "dot",
        "x": 632,
        "y": 864,
        "cn": "万福街",
        "en": "Wanfu Jie",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0230": {
        "type": "dot",
        "x": 716,
        "y": 864,
        "cn": "景阳广场",
        "en": "Jingyang Guangchang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0231": {
        "type": "tsf",
        "x": 780,
        "y": 864,
        "cn": "解放桥",
        "en": "Jiefang Qiao",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0232": {
        "type": "dot",
        "x": 898,
        "y": 864,
        "cn": "建设广场",
        "en": "Jianshe Guangchang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0233": {
        "type": "dot",
        "x": 982,
        "y": 864,
        "cn": "文化广场",
        "en": "Wenhua Guangchang",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0233-1": {
        "type": "no",
        "hideLabel": true,
        "x": 982,
        "y": 864,
        "cn": "文化广场",
        "en": "Wenhua Guangchang",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0235": {
        "type": "dot",
        "x": 1164,
        "y": 864,
        "cn": "平阳街",
        "en": "Pingyang Jie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0236": {
        "type": "dot",
        "x": 1248,
        "y": 864,
        "cn": "南关",
        "en": "Nanguan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0237": {
        "type": "tsf",
        "x": 1332,
        "y": 864,
        "cn": "吉林大路",
        "en": "Jilin Dalu",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0238": {
        "type": "dot",
        "x": 1416,
        "y": 864,
        "cn": "东盛大街",
        "en": "Dongsheng Dajie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0239": {
        "type": "tsf",
        "x": 1500,
        "y": 864,
        "cn": "东环城路",
        "en": "Donghuanchenglu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -8
        }
    },
    "0240": {
        "type": "dot",
        "x": 1584,
        "y": 864,
        "cn": "长青",
        "en": "Changqing",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0241": {
        "type": "dot",
        "x": 1668,
        "y": 864,
        "cn": "东方广场",
        "en": "Dongfang Guangchang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0242": {
        "type": "dot",
        "x": 1752,
        "y": 864,
        "cn": "哈尔滨大街",
        "en": "Ha'erbin Dajie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0243": {
        "type": "dot",
        "x": 1836,
        "y": 864,
        "cn": "窦家沟",
        "en": "Doujiagou",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0244": {
        "type": "dot",
        "x": 1920,
        "y": 864,
        "cn": "英俊大街",
        "en": "Yingjun Dajie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0245": {
        "type": "dot",
        "x": 2004,
        "y": 864,
        "cn": "英凯大街",
        "en": "Yingkai Dajie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0246": {
        "type": "dot",
        "x": 2088,
        "y": 864,
        "cn": "林溪大街",
        "en": "Linxi Dajie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0247": {
        "type": "dot",
        "x": 2172,
        "y": 864,
        "cn": "雾开河大街",
        "en": "Wukaihe Dajie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0321": {
        "type": "tsf",
        "x": 1240,
        "y": 556,
        "cn": "伪满皇宫",
        "en": "Weimanhuanggong",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0322": {
        "type": "dot",
        "x": 1164,
        "y": 584,
        "cn": "东广场",
        "en": "Dongguangchang",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0325": {
        "type": "dot",
        "x": 1002,
        "y": 642,
        "cn": "芙蓉桥",
        "en": "Furong Qiao",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0326": {
        "type": "dot",
        "x": 951,
        "y": 693,
        "cn": "西安桥",
        "en": "Xi'an Qiao",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0327": {
        "type": "dot",
        "x": 900,
        "y": 744,
        "cn": "南昌路",
        "en": "Nanchang Lu",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0328": {
        "type": "dot",
        "x": 850,
        "y": 794,
        "cn": "朝阳桥",
        "en": "Chaoyang Qiao",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0330": {
        "type": "dot",
        "x": 750,
        "y": 906,
        "cn": "湖西桥",
        "en": "Huxi Qiao",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0331": {
        "type": "dot",
        "x": 750,
        "y": 962,
        "cn": "宽平桥",
        "en": "Kuanping Qiao",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0332": {
        "type": "dot",
        "x": 750,
        "y": 1024,
        "cn": "抚松路",
        "en": "Fusong Lu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0333": {
        "type": "tsf",
        "x": 750,
        "y": 1088,
        "cn": "孟家屯",
        "en": "Mengjiatun",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0334": {
        "type": "dot",
        "x": 766,
        "y": 1172,
        "cn": "湖光路",
        "en": "Huguang Lu",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0335": {
        "type": "dot",
        "x": 798,
        "y": 1204,
        "cn": "电台街",
        "en": "Diantai Jie",
        "align": "right",
        "offset": {
            "x": 10,
            "y": 0
        }
    },
    "0335-1": {
        "type": "no",
        "hideLabel": true,
        "x": 798,
        "y": 1204,
        "cn": "电台街",
        "en": "Diantai Jie",
        "align": "right",
        "offset": {
            "x": 10,
            "y": 0
        }
    },
    "0336": {
        "type": "dot",
        "x": 856,
        "y": 1256,
        "cn": "前进西",
        "en": "Qianjin Xi",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0337": {
        "type": "dot",
        "x": 912,
        "y": 1256,
        "cn": "前进大街",
        "en": "Qianjin Dajie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0338": {
        "type": "dot",
        "x": 968,
        "y": 1256,
        "cn": "卫明街",
        "en": "Weiming Jie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0339": {
        "type": "dot",
        "x": 1024,
        "y": 1256,
        "cn": "卫光街",
        "en": "Weiguang Jie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0341": {
        "type": "dot",
        "x": 1164,
        "y": 1256,
        "cn": "亚泰立交桥",
        "en": "Yatai Lijiaoqiao",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0342": {
        "type": "dot",
        "x": 1248,
        "y": 1256,
        "cn": "伊通河",
        "en": "Yitong He",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0343": {
        "type": "tsf",
        "x": 1332,
        "y": 1256,
        "cn": "职业技术大学",
        "en": "Zhiye Jishu Daxue",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0344": {
        "type": "dot",
        "x": 1416,
        "y": 1256,
        "cn": "吉林广电",
        "en": "Jilin Guangdian",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0345": {
        "type": "dot",
        "x": 1500,
        "y": 1256,
        "cn": "会展中心",
        "en": "Huizhan Zhongxin",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0346": {
        "type": "dot",
        "x": 1584,
        "y": 1256,
        "cn": "世纪广场",
        "en": "Shiji Guangchang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0347": {
        "type": "dot",
        "x": 1668,
        "y": 1298,
        "cn": "金鑫街",
        "en": "Jinxin Jie",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0348": {
        "type": "dot",
        "x": 1710,
        "y": 1340,
        "cn": "博硕路",
        "en": "Boshuo Lu",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0349": {
        "type": "dot",
        "x": 1752,
        "y": 1382,
        "cn": "金河街",
        "en": "Jinhe Jie",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0350": {
        "type": "dot",
        "x": 1794,
        "y": 1424,
        "cn": "农博园",
        "en": "Nongboyuan",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0351": {
        "type": "dot",
        "x": 1836,
        "y": 1508,
        "cn": "净月潭公园",
        "en": "Jingyuetan Gongyuan",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0352": {
        "type": "dot",
        "x": 1836,
        "y": 1564,
        "cn": "紫杉路",
        "en": "Zishan Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0353": {
        "type": "dot",
        "x": 1836,
        "y": 1620,
        "cn": "宝相街",
        "en": "Baoxiang Jie",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0354": {
        "type": "dot",
        "x": 1836,
        "y": 1676,
        "cn": "滑雪场",
        "en": "Huaxuechang",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0355": {
        "type": "tsf",
        "x": 1836,
        "y": 1732,
        "cn": "长影世纪城",
        "en": "Changying Shijicheng",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0356": {
        "type": "no",
        "x": 1836,
        "y": 1790,
        "cn": "天泽大路",
        "en": "Tianze Dalu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0357": {
        "type": "no",
        "x": 1836,
        "y": 1840,
        "cn": "文远大路",
        "en": "Wenyuan Dalu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0422": {
        "type": "dot",
        "x": 1164,
        "y": 500,
        "cn": "北亚泰大街",
        "en": "Beiyatai Dajie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0424": {
        "type": "dot",
        "x": 1298,
        "y": 614,
        "cn": "东大桥",
        "en": "Dongdaqiao",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0424-1": {
        "type": "no",
        "hideLabel": true,
        "x": 1298,
        "y": 614,
        "cn": "东大桥",
        "en": "Dongdaqiao",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0425": {
        "type": "dot",
        "x": 1332,
        "y": 752,
        "cn": "东新路",
        "en": "Dongxin Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0427": {
        "type": "dot",
        "x": 1332,
        "y": 920,
        "cn": "公平路",
        "en": "Gongping Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0428": {
        "type": "dot",
        "x": 1332,
        "y": 976,
        "cn": "海口路",
        "en": "Haikou Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0429": {
        "type": "dot",
        "x": 1332,
        "y": 1032,
        "cn": "浦东路",
        "en": "Pudong Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0430": {
        "type": "tsf",
        "x": 1332,
        "y": 1088,
        "cn": "威海路",
        "en": "Weihai Lu",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0431": {
        "type": "dot",
        "x": 1332,
        "y": 1172,
        "cn": "北海路",
        "en": "Beihai Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0433": {
        "type": "dot",
        "x": 1332,
        "y": 1312,
        "cn": "世荣路",
        "en": "Shirong Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0434": {
        "type": "dot",
        "x": 1332,
        "y": 1368,
        "cn": "南环城路",
        "en": "Nanhuanchenglu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0435": {
        "type": "dot",
        "x": 1332,
        "y": 1424,
        "cn": "宜盛街",
        "en": "Yisheng Jie",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0436": {
        "type": "dot",
        "x": 1332,
        "y": 1480,
        "cn": "天工路",
        "en": "Tiangong Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0437": {
        "type": "tsf",
        "x": 1332,
        "y": 1554,
        "cn": "福祉大路",
        "en": "Fuzhi Dalu",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0438": {
        "type": "dot",
        "x": 1332,
        "y": 1648,
        "cn": "天青路",
        "en": "Tianqing Lu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0439": {
        "type": "dot",
        "x": 1332,
        "y": 1704,
        "cn": "天普路",
        "en": "Tianpu Lu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0440": {
        "type": "dot",
        "x": 1332,
        "y": 1760,
        "cn": "前十里堡",
        "en": "Qianshilipu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0441": {
        "type": "dot",
        "x": 1332,
        "y": 1816,
        "cn": "天新路",
        "en": "Tianxin Lu",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0623": {
        "type": "dot",
        "x": 352,
        "y": 942,
        "cn": "腾跃街",
        "en": "Tengyue Jie",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0624": {
        "type": "dot",
        "x": 411,
        "y": 998,
        "cn": "支农大街",
        "en": "Zhinong Dajie",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0625": {
        "type": "tsf",
        "x": 505,
        "y": 1088,
        "cn": "飞跃广场",
        "en": "Feiyue Guangchang",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0626": {
        "type": "dot",
        "x": 575,
        "y": 1154,
        "cn": "欧亚卖场",
        "en": "Ouya Maichang",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0627": {
        "type": "dot",
        "x": 645,
        "y": 1220,
        "cn": "光谷大街",
        "en": "Guanggu Dajie",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0628": {
        "type": "dot",
        "x": 716,
        "y": 1286,
        "cn": "硅谷广场(吉大中心校区)",
        "en": "Guigu Guangchang(Jida Zhongxin Xiaoqu)",
        "align": "left",
        "offset": {
            "x": -10,
            "y": 0
        }
    },
    "0628-1": {
        "type": "no",
        "hideLabel": true,
        "x": 716,
        "y": 1286,
        "cn": "硅谷广场(吉大中心校区)",
        "en": "Guigu Guangchang(Jida Zhongxin Xiaoqu)",
        "align": "left",
        "offset": {
            "x": -10,
            "y": 0
        }
    },
    "0629": {
        "type": "dot",
        "x": 768,
        "y": 1336,
        "cn": "百花园",
        "en": "Baihuayuan",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0630": {
        "type": "dot",
        "x": 825,
        "y": 1390,
        "cn": "市法院",
        "en": "Shifayuan",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0631": {
        "type": "dot",
        "x": 904,
        "y": 1424,
        "cn": "兰桡湖公园",
        "en": "Lanraohu Gongyuan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0632": {
        "type": "dot",
        "x": 962,
        "y": 1424,
        "cn": "轨道集团",
        "en": "Guidao Jituan",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0633": {
        "type": "dot",
        "x": 1020,
        "y": 1424,
        "cn": "新明街",
        "en": "Xinming Jie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0635": {
        "type": "dot",
        "x": 1248,
        "y": 1472,
        "cn": "南溪湿地公园",
        "en": "Nanxi Shidi Gongyuan",
        "align": "bottom-left",
        "offset": {
            "x": -6,
            "y": 4
        }
    },
    "0637": {
        "type": "dot",
        "x": 1423,
        "y": 1648,
        "cn": "吴家店",
        "en": "Wujiadian",
        "align": "top-right",
        "offset": {
            "x": 6,
            "y": -4
        }
    },
    "0638": {
        "type": "dot",
        "x": 1528,
        "y": 1732,
        "cn": "亚泰足球基地",
        "en": "Yatai Zuqiu Jidi",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0639": {
        "type": "dot",
        "x": 1605,
        "y": 1732,
        "cn": "樱花街",
        "en": "Yinghua Jie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0640": {
        "type": "dot",
        "x": 1682,
        "y": 1732,
        "cn": "聚业大街",
        "en": "Juye Dajie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0641": {
        "type": "dot",
        "x": 1759,
        "y": 1732,
        "cn": "省博物院",
        "en": "Shengbowuyuan",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0722": {
        "type": "dot",
        "x": 184,
        "y": 1088,
        "cn": "西湖大路",
        "en": "Xihu Dalu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0723": {
        "type": "dot",
        "x": 268,
        "y": 1088,
        "cn": "兴安路",
        "en": "Xing'an Lu",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0724": {
        "type": "dot",
        "x": 352,
        "y": 1088,
        "cn": "兴顺路",
        "en": "Xingshun Lu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0726": {
        "type": "dot",
        "x": 610,
        "y": 1088,
        "cn": "第一汽车制造厂",
        "en": "Diyi Qiche Zhizaochang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0728": {
        "type": "dot",
        "x": 832,
        "y": 1088,
        "cn": "辉南街",
        "en": "Huinan Jie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0729": {
        "type": "dot",
        "x": 915,
        "y": 1088,
        "cn": "南湖广场(吉大南湖校区)",
        "en": "Nanhu Guangchang(Jida Nanhu Xiaoqu)",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0729-1": {
        "type": "no",
        "hideLabel": true,
        "x": 915,
        "y": 1088,
        "cn": "南湖广场(吉大南湖校区)",
        "en": "Nanhu Guangchang(Jida Nanhu Xiaoqu)",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0730": {
        "type": "dot",
        "x": 997,
        "y": 1088,
        "cn": "南湖公园",
        "en": "Nanhu Gongyuan",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0732": {
        "type": "dot",
        "x": 1164,
        "y": 1088,
        "cn": "省税务局",
        "en": "Shengshuiwuju",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0733": {
        "type": "dot",
        "x": 1248,
        "y": 1088,
        "cn": "东岭南街",
        "en": "Dongling Nanjie",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0735": {
        "type": "dot",
        "x": 1388,
        "y": 1088,
        "cn": "赛得广场",
        "en": "Saide Guangchang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0736": {
        "type": "dot",
        "x": 1444,
        "y": 1088,
        "cn": "会展大街",
        "en": "Huizhan Dajie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0737": {
        "type": "dot",
        "x": 1500,
        "y": 1032,
        "cn": "中东大市场",
        "en": "Zhongdong Dashichang",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0738": {
        "type": "dot",
        "x": 1500,
        "y": 948,
        "cn": "岭东路",
        "en": "Lingdong Lu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0822": {
        "type": "dot",
        "x": 1080,
        "y": 220,
        "cn": "一二三中学",
        "en": "Yi'ersan Zhongxue",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0823": {
        "type": "dot",
        "x": 1080,
        "y": 164,
        "cn": "小南",
        "en": "Xiaonan",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0824": {
        "type": "dot",
        "x": 1080,
        "y": 108,
        "cn": "小城子街",
        "en": "Xiaochengzi Jie",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0825": {
        "type": "dot",
        "x": 1164,
        "y": 80,
        "cn": "北湖大桥",
        "en": "Beihu Daqiao",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0826": {
        "type": "dot",
        "x": 1248,
        "y": 80,
        "cn": "北湖公园",
        "en": "Beihu Gongyuan",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0827": {
        "type": "dot",
        "x": 1332,
        "y": 80,
        "cn": "和安街",
        "en": "He'an Jie",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0828": {
        "type": "dot",
        "x": 1416,
        "y": 80,
        "cn": "光机路",
        "en": "Guangji Lu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0829": {
        "type": "dot",
        "x": 1500,
        "y": 80,
        "cn": "大学城路",
        "en": "Daxuecheng Lu",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0830": {
        "type": "dot",
        "x": 1584,
        "y": 80,
        "cn": "地理所",
        "en": "Dilisuo",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0831": {
        "type": "dot",
        "x": 1668,
        "y": 80,
        "cn": "奥林匹克公园",
        "en": "Aolinpike Gongyuan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        }
    },
    "0832": {
        "type": "dot",
        "x": 1752,
        "y": 80,
        "cn": "广通路",
        "en": "Guangtong Lu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        }
    },
    "0502": {
        type: "no",
        "x": 1238,
        "y": 674,
        "cn": "省妇儿中心",
        "en": "Shengfu'er Zhongxin",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0503": {
        type: "no",
        "x": 1178,
        "y": 734,
        "cn": "大经路",
        "en": "Dajing Lu",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0505": {
        type: "no",
        "x": 982,
        "y": 780,
        "cn": "同志街",
        "en": "Tongzhi Jie",
        "align": "left",
        "offset": {
            "x": -6,
            "y": 0
        }
    },
    "0507": {
        type: "no",
        "x": 982,
        "y": 930,
        "cn": "红旗街",
        "en": "Hongqi Jie",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        }
    },
    "0508": {
        type: "no",
        "x": 982,
        "y": 1010,
        "cn": "长影旧址博物馆",
        "en": "Changying Jiuzhi Bowuguan",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        }
    },
    "0510": {
        type: "no",
        "x": 862,
        "y": 1141,
        "cn": "省委党校",
        "en": "Shengwei Dangxiao",
        "align": "bottom-right",
        "offset": {
            "x": 6,
            "y": 4
        }
    },
    "0513": {
        type: "no",
        "x": 672,
        "y": 1332,
        "cn": "蔚山路",
        "en": "Weishan Lu",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0514": {
        type: "no",
        "x": 622,
        "y": 1382,
        "cn": "安新路",
        "en": "Anxin Lu",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0515": {
        type: "no",
        "x": 572,
        "y": 1432,
        "cn": "越达路",
        "en": "Yueda Lu",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0516": {
        type: "no",
        "x": 522,
        "y": 1482,
        "cn": "顺达路",
        "en": "Shunda Lu",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0517": {
        type: "no",
        "x": 472,
        "y": 1532,
        "cn": "市委党校",
        "en": "Shiwei Dangxiao",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "0518": {
        type: "no",
        "x": 422,
        "y": 1582,
        "cn": "卓越大街",
        "en": "Zhuoyue Dajie",
        "align": "top-left",
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "G5401": {
        type: "no",
        "x": 965,
        "y": 930,
        "cn": "工农大路",
        "en": "",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5402": {
        type: "dot",
        "x": 935,
        "y": 960,
        "cn": "长影",
        "en": "",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5403": {
        type: "dot",
        "x": 905,
        "y": 984,
        "cn": "湖西路",
        "en": "",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5404": {
        type: "dot",
        "x": 859,
        "y": 984,
        "cn": "长久路",
        "en": "",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5405": {
        type: "dot",
        "x": 813,
        "y": 984,
        "cn": "宽平大路",
        "en": "",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5406": {
        type: "dot",
        "x": 767,
        "y": 984,
        "cn": "宽平大桥",
        "en": "",
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5407": {
        type: "dot",
        "x": 721,
        "y": 984,
        "cn": "迎春路",
        "en": "",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5408": {
        type: "dot",
        "x": 673,
        "y": 978,
        "cn": "东风大街",
        "en": "",
        "align": "bottom-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5409": {
        type: "dot",
        "x": 650,
        "y": 955,
        "cn": "创业大街",
        "en": "",
        "align": "bottom-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5410": {
        type: "dot",
        "x": 628,
        "y": 933,
        "cn": "南阳路",
        "en": "",
        "align": "bottom-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5411": {
        type: "dot",
        "x": 620,
        "y": 905,
        "cn": "电车公司",
        "en": "",
        "align": "right",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5412": {
        type: "dot",
        "x": 620,
        "y": 875,
        "cn": "景阳大路",
        "en": "",
        "align": "left",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5413": {
        type: "dot",
        "x": 620,
        "y": 845,
        "cn": "皓月大路",
        "en": "",
        "align": "right",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5414": {
        type: "dot",
        "x": 620,
        "y": 815,
        "cn": "绿园",
        "en": "",
        "align": "right",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5415": {
        type: "dot",
        "x": 620,
        "y": 785,
        "cn": "农丰市场",
        "en": "",
        "align": "right",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5416": {
        type: "dot",
        "x": 620,
        "y": 755,
        "cn": "西安大路",
        "en": "",
        "align": "right",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5511": {
        type: "dot",
        "x": 580,
        "y": 925,
        "cn": "和平大街",
        "en": "",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5512": {
        type: "dot",
        "x": 540,
        "y": 925,
        "cn": "洛阳街",
        "en": "",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5513": { 
        type: "dot",
        "x": 500,
        "y": 925,
        "cn": "西环城路",
        "en": "",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5514": {
        type: "dot",
        "x": 460,
        "y": 925,
        "cn": "绿地长春上海城",
        "en": "",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.8, en: 1.0 }
    },
    "G5515": { 
        type: "dot",
        "x": 420,
        "y": 925,
        "cn": "翔天街",
        "en": "",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5516": {
        type: "dot",
        "x": 380,
        "y": 925,
        "cn": "腾跃街",
        "en": "",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5517": {
        type: "dot",
        "x": 345,
        "y": 910,
        "cn": "市八十七中学南",
        "en": "",
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5518": {
        type: "dot",
        "x": 315,
        "y": 880,
        "cn": "站前街",
        "en": "",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "G5519": {
        type: "dot",
        "x": 290,
        "y": 855,
        "cn": "长春西站",
        "en": "",
        "align": "right",
        hideLabel: true,
        "offset": {
            "x": 6,
            "y": 0
        },
        textScale: { cn: 0.9, en: 1.0 }
    },
    "CCT": { 
        "type": "rdot",
        "x": 1110,
        "y": 540,
        "cn": "长春站",
        "en": "Changchun Railway Station",
        "align": "top-left",
        hideLabel: true,
        "offset": {
            "x": -6,
            "y": -4
        }
    },
    "CRT": { 
        "type": "rdot",
        "x": 268,
        "y": 845,
        "cn": "长春西站",
        "en": "Changchunxi Railway Station",
        "align": "top",
        hideLabel: true,
        "offset": {
            "x": 0,
            "y": -8
        }
    },
};

if (typeof window !== 'undefined') {
    window.stationsData = stationsData;
    if (window.CHANGCHUN_CITY) window.CHANGCHUN_CITY.stationsData = stationsData;
}
