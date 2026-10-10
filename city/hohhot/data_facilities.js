/**
 * CGo OpenMap - 呼和浩特车站层级图数据
 *
 * ⚠️ 本文件由官网「服务设施」接口抓取整理生成；重抓口径见下。
 *
 * 数据源：呼和浩特地铁官网「服务设施」页 https://www.hhhtmetro.com/site/fwss
 *   接口 https://www.hhhtmetro.com/site/getSiteName?line=1|2 （XML）
 * 抓取日期：2026-10-04
 * 收录：1 号线 20 张 + 2 号线 24 张 = 44 条；新华广场为 1 / 2 号线换乘站，
 *   两线各发布一条且 SHESHI_IMG 相同，本表合并为唯一键 M108，
 *   最终 43 座车站各对应一张层级图。键与 city/hohhot/data_stations.js 的站序逐条核对一致。
 * 键：本站车站 ID（M101…M120 / M201…M223）；值：官网车站层级图（剖面图）直链。
 *
 * ⚠️ 官网这批层级图是 2021-08 上传的，文件名仍是改名前的拼音，例如
 *   呼钢南路 = hugangdonglu.png（旧名「呼钢东路」）、
 *   北山公园 = xinchengtushuguan.png（旧名「新城图书馆」）、
 *   丝绸之路大道 = dongerhuanlu.png（旧名「东二环路」）；
 *   图上文字可能仍是旧站名，属官网原始状态，此处不改。
 *
 * 由车站设施板块（city/hohhot/modules/hohhot_facilities.js，渲染在共享层
 * city/shenyang/shared/station/facilities.js）读取：折叠行默认展开、缩略图懒加载
 * （loading="lazy"），点击缩略图在新标签页打开官网原图；图片加载失败即不展示该条目。
 */
const HOHHOT_STATION_LEVEL_MAP = {
    "M101": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/yilijiankanggu.png",
    "M102": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/xierhuanlu.png",
    "M103": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/kongjiaying.png",
    "M104": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/hugangdonglu.png",
    "M105": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/xilongwangmiao.png",
    "M106": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/wulanfujinianguan.png",
    "M107": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/fushuyiyuan.png",
    "M108": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/xinhuaguangchang.png",
    "M109": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/renminhuitang.png",
    "M110": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/jiangjunyashu.png",
    "M111": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/yishuxueyuan.png",
    "M112": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/dongyinglu.png",
    "M113": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/neimengguzhanlanguan.png",
    "M114": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/neimenggubowuguan.png",
    "M115": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/shizhengfu.png",
    "M116": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/huhehaotedongzhan.png",
    "M117": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/houbutaqi.png",
    "M118": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/shenlandai.png",
    "M119": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/baitaxi.png",
    "M120": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/bayan（jichang）.png",
    "M201": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/talidonglu.png",
    "M202": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/xindian.png",
    "M203": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/baihelu.png",
    "M204": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/xinchengtushuguan.png",
    "M205": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/dongerhuanlu.png",
    "M206": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/yijiacun.png",
    "M207": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/chengjisihangongyuan.png",
    "M208": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/haoqinying.png",
    "M209": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/chengjisihanguangchang.png",
    "M210": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/neimenggutiyuguan.png",
    "M211": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/huhehaotetiyuchang.png",
    "M212": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/gongzhufu.png",
    "M213": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/huhehaotezhan.png",
    "M214": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/zhongshanlu.png",
    "M215": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/daxuexijie.png",
    "M216": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/nuohemulei.png",
    "M217": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/shuishanggongyuan.png",
    "M218": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/wuliying.png",
    "M219": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/xilingongyuan.png",
    "M220": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/neidananxiaoqu.png",
    "M221": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/shuaijiaying.png",
    "M222": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/lamaying.png",
    "M223": "https://hhhtmetro.com/UploadModule/uploads/hsdt/2021/08/05/aershanlu.png",
};
window.HOHHOT_STATION_LEVEL_MAP = HOHHOT_STATION_LEVEL_MAP;
