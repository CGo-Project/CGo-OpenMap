/**
 * CGo OpenMap - 呼和浩特虚拟换乘配置 (city/hohhot/data_virtual_transfers.js)
 *
 * 1、2 号线在「新华广场」为站内换乘（已共用同一车站 ID 与坐标），不在此登记。
 * 本文件录入的是「国铁车站 ↔ 同名地铁站」的**付费虚拟换乘**：
 * 两者分属国铁与地铁两套票务系统、站厅不连通，出站换乘需重新购票。
 *
 * - VIRTUAL_TRANSFER_MAP：付费虚拟换乘（双向成对），车站信息板据此提示可换乘对象；
 * - VIRTUAL_CONNECT_LINES：站外换乘连接线（由引擎绘制）。本城国铁站与地铁站坐标完全
 *   重合，无需连线，故留空。
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];
const VIRTUAL_TRANSFER_MAP = {
    // 呼和浩特站：NHC（国铁）↔ M213（地铁 2 号线）
    "NHC": ["M213"],
    "M213": ["NHC"],
    // 呼和浩特东站：NDC（国铁）↔ M116（地铁 1 号线）
    "NDC": ["M116"],
    "M116": ["NDC"]
};
const VIRTUAL_CONNECT_LINES = [];
