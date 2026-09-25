/**
 * CGo OpenMap - 香港鐵路圖例配置 (city/hongkong/data_legend.js)
 *
 * 分組與命名對應綫路圖左下角圖例（綫路顏色為各綫公開標誌色）。
 */

const LEGEND_CONFIG = [
    {
        "type": "title",
        "title": "香港鐵路綫",
        "subtitle": "MTR Lines (unofficial recreation)"
    },
    {
        "type": "grid",
        "cols": 2,
        "items": [
            {
                "targets": [
                    "AEL"
                ],
                "name": "機場快綫 Airport Express"
            },
            {
                "targets": [
                    "DRL"
                ],
                "name": "迪士尼綫 Disneyland Resort Line"
            },
            {
                "targets": [
                    "EAL"
                ],
                "name": "東鐵綫 East Rail Line"
            },
            {
                "targets": [
                    "ISL"
                ],
                "name": "港島綫 Island Line"
            },
            {
                "targets": [
                    "KTL"
                ],
                "name": "觀塘綫 Kwun Tong Line"
            },
            {
                "targets": [
                    "SIL"
                ],
                "name": "南港島綫 South Island Line"
            },
            {
                "targets": [
                    "TKL"
                ],
                "name": "將軍澳綫 Tseung Kwan O Line"
            },
            {
                "targets": [
                    "TWL"
                ],
                "name": "荃灣綫 Tsuen Wan Line"
            },
            {
                "targets": [
                    "TML"
                ],
                "name": "屯馬綫 Tuen Ma Line"
            },
            {
                "targets": [
                    "TCL"
                ],
                "name": "東涌綫 Tung Chung Line"
            }
        ]
    },
    {
        "type": "title",
        "title": "輕鐵與跨境鐵路",
        "subtitle": "Light Rail & Cross-boundary"
    },
    {
        "type": "grid",
        "cols": 2,
        "items": [
            {
                "targets": [
                    "LR"
                ],
                "name": "輕鐵 Light Rail"
            },
            {
                "targets": [
                    "HSR"
                ],
                "name": "高速鐵路 High Speed Rail"
            }
        ]
    }
];

if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.HONGKONG_CITY) window.HONGKONG_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
