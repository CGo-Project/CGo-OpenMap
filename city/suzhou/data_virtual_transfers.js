/**
 * CGo OpenMap - 出站虚拟换乘与站外连通 (city/suzhou/data_virtual_transfers.js)
 *
 * 高新有轨电车与地铁是两套独立的站厅与站台，同名的 3 组车站均为**站外换乘**：
 *   有轨 1 号线 狮子山（TSNZ101）      ⇄ 地铁 1 / 3 号线 狮子山（M105）
 *   有轨 2 号线 苏州新区火车站（TSNZ214）⇄ 地铁 3 / 6 号线 苏州新区火车站（M301）
 *   有轨 2 号线 文昌路（TSNZ216）      ⇄ 地铁 3 号线 文昌路（M303）
 *   有轨 1 号线 龙康路（TSNZ111）      ⇄ 有轨 2 号线 龙康路（TSNZ215）
 * 2 号线内部不再有跨线换乘：原「有轨 5 号线」只是土建编号，运行系统上归 2 号线，
 * 两条交路（南京大学东—苏州新区火车站、龙康路—文昌路）在航船浜—鸿福路之间共线，
 * 航船浜（TSNZ203）因此只是共线段上的普通站。
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];

const VIRTUAL_TRANSFER_MAP = {
    // 狮子山：有轨 1 号线 ⇄ 地铁 1 / 3 号线
    "TSNZ101": ["M105"],
    "M105": ["TSNZ101"],
    // 苏州新区火车站：有轨 2 号线 ⇄ 地铁 3 / 6 号线
    "TSNZ214": ["M301"],
    "M301": ["TSNZ214"],
    // 文昌路：有轨 2 号线 ⇄ 地铁 3 号线
    "TSNZ216": ["M303"],
    "M303": ["TSNZ216"],
    // 龙康路：有轨 1 号线 ⇄ 有轨 2 号线
    "TSNZ111": ["TSNZ215"],
    "TSNZ215": ["TSNZ111"]
};

const VIRTUAL_CONNECT_LINES = [
    { from: "TSNZ101", to: "M105" },
    { from: "TSNZ214", to: "M301" },
    { from: "TSNZ216", to: "M303" },
    { from: "TSNZ111", to: "TSNZ215" }
];
