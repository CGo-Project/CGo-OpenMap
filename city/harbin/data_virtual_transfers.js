/**
 * CGo OpenMap - 哈尔滨虚拟换乘配置 (city/harbin/data_virtual_transfers.js)
 *
 * 本城只录入「国铁车站 ↔ 同名地铁站」的付费虚拟换乘：
 * 两者分属国铁与地铁两套票务系统、站厅不连通，出站换乘需重新购票。
 *
 * - VIRTUAL_TRANSFER_MAP：付费虚拟换乘（双向成对），车站信息板据此提示可换乘对象；
 * - VIRTUAL_CONNECT_LINES：站外换乘连接线（由引擎绘制）。哈尔滨的国铁站与地铁站
 *   坐标完全重合，无需连线，故留空。
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];
const VIRTUAL_TRANSFER_MAP = {
    // 哈尔滨站：HBB（国铁）↔ HEB（地铁 2 号线）
    "HBB": ["HEB"],
    "HEB": ["HBB"],
    // 哈尔滨西站：VAB（国铁）↔ HEBX（地铁 3 号线）
    "VAB": ["HEBX"],
    "HEBX": ["VAB"],
    // 哈尔滨北站：HTB（国铁）↔ HEBB（地铁 2 号线）
    "HTB": ["HEBB"],
    "HEBB": ["HTB"],
    // 哈尔滨东站：VBB（国铁）↔ HEBD（地铁 1 号线）
    "VBB": ["HEBD"],
    "HEBD": ["VBB"]
};
const VIRTUAL_CONNECT_LINES = [];
