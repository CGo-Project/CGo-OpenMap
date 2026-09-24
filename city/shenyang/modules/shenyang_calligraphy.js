/**
 * CGo OpenMap - 沈阳站名题字配置
 *
 * 题字渲染逻辑已抽到共享层 `shared/calligraphy.js`（供多城共用），本文件只保留
 * 沈阳侧的差异配置：题字数据全局名、header 取色优先级、可读文字色来源，以及
 * 方城地标在染色 header 上换用白色单色版的联动。
 *
 * 加载顺序：shenyang.js 的 loadStationBoardModules() 先 document.write 共享层，
 * 再加载本文件，故此处可直接调用 window.CGoCalligraphy.register()。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const FANGCHENG_MONO_SRC = "./city/shenyang/assets/fangcheng_mono.svg";

    const calligraphy = window.CGoCalligraphy;
    if (!calligraphy) {
        console.warn("[shenyang_calligraphy] 共享层 CGoCalligraphy 未加载，题字模块未注册");
        return;
    }

    calligraphy.register({
        idPrefix: "shenyang",
        cityName: "沈阳",
        dataGlobals: ["CALLIGRAPHY_DATA"],
        /**
         * 换乘题字站 header 取色优先级（按稳定线路 ID，不依赖 relatedLinesInfo 的排序）。
         * 目前已知有题字的为 1、2、3 号线；表中列入全部运营线以备后续扩展。
         */
        lineColorPriority: ["SYM01", "SYM02", "SYM09", "SYM10", "SYM04", "SYM03"],
        /** 沈阳的取色实现由 shenyang_station_board.js 暴露，与线路徽标共用同一套判定 */
        getReadableTextColor: (color) => window.ShenyangUi?.getReadableTextColor?.(color) || "#ffffff",
        /**
         * 方城地标在染色 header 上：深底（白字）切换为白色单色版；
         * 浅底（深字，如 10 号线浅绿）保留彩色原图——目前仅有白色 mono，
         * 待补充深色 mono 后在此扩展。header 每次重建，无需手工还原。
         */
        onHeaderMounted(header, { onColor }) {
            const decoration = header.querySelector(".shenyang-station-header-decoration");
            if (!decoration) return;
            if (onColor.toLowerCase() !== "#ffffff") return;
            decoration.dataset.syOriginalSrc = decoration.dataset.syOriginalSrc
                || decoration.getAttribute("src");
            decoration.setAttribute("src", FANGCHENG_MONO_SRC);
        }
    });

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-calligraphy" }
    }));
})();
