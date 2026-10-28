const linesData = [
    {
        id: "YC-SRT1",
        name: "SRT 1号线",
        company: "盐城公交",
        color: "#EA0537",
        svg: "./city/yancheng/assets/yc-srt1.svg",
        /* 智轨轨道纹理：白虚线 + 同色细芯（比例取自 AI 第 14 页示例） */
        overlayStyles: [
            { color: "#FFFFFF", width: 2.16, opacity: 1, dashArray: "3.26 1.36" },
            { color: "#EA0537", width: 1.08, opacity: 1, dashArray: "none" }
        ],
        stationIds: ["YC01", "YC02", "YC03", "YC04", "YC05", "YC06", "YC07", "YC08", "YC09", "YC10", "YC11", "YC12", "YC13", "YC14", "YC15", "YC16", "YC17"],
        pathPoints: [{x: 130.6, y: 440.3, r: 0}, {x: 478.8, y: 92.1, r: 0}],
        distances: ["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??"]
    }
];
