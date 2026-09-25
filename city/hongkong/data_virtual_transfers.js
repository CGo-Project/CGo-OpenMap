/**
 * CGo OpenMap - 香港步行換乘配置 (city/hongkong/data_virtual_transfers.js)
 *
 * 綫路圖上的步行換乘連接綫（中環—香港的付費區通道、尖沙咀—尖東與九龍—柯士甸的閘外步行）
 * 已作為靜態圖層繪於 hongkong_deco.svg；換乘說明由 hongkong.js 的「步行換乘」模塊提供，
 * 因此這裡不再讓引擎重複繪製虛擬換乘綫。
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];
const VIRTUAL_TRANSFER_MAP = {};
const VIRTUAL_CONNECT_LINES = [];
