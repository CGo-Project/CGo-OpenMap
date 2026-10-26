/**
 * CGo OpenMap - 北京规划 城市业务接口与核心调度 (city/beijing_plan/beijing_plan.js)
 */

(function () {
    // 载入本城样式
    (function loadCityStylesheet() {
        if (typeof document === 'undefined') return;
        const href = "./city/beijing_plan/style.css";
        if (document.querySelector('link[href^="' + href + '"]')) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href + "?v=" + (window.CGoVersion || Date.now());
        document.head.appendChild(link);
    })();

    const BeijingPlanCity = {
        id: "beijing_plan",
        name: "北京规划",
        SUBURBAN_LINES: ["S_FZX", "S_S2", "S_HRMY", "S_TM", "S_DBH"],
        MAP_12306: {
            "北京南站": "VNP",
            "北京西站": "BXP",
            "北京站": "BJP",
            "北京北站": "VAP",
            "清河站": "QIP",
            "北京朝阳站": "IFP",
            "北京丰台站": "FTP",
            "北京城市副中心站": "FOP",
            "大兴机场站": "DAP",
            "雄安站": "XAP"
        }
    };

    window.BeijingPlanCity = BeijingPlanCity;
})();
