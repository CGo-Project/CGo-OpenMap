/**
 * CGo OpenMap - 青岛散点元素
 * 交通图标使用用户提供的自定义 SVG。
 */
const SCATTERED_DATA = [
    {
        id: "qingdao-sea",
        file: "./city/qingdao/assets/qingdao_sea.svg",
        x: 1500,
        y: 1250,
        width: 3000,
        height: 2500,
        opacity: 1,
        zIndex: 1
    },
    {
        id: "railway-qingdao",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 1266,
        y: 1474,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-qingdao-north",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 1614,
        y: 866,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-hongdao",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 1015,
        y: 535,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-jiaozhou-north",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 912,
        y: 220,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-dongjiakou",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 295,
        y: 2285,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "airport-jiaodong",
        file: "./city/qingdao/assets/Aircraft.svg",
        x: 912,
        y: 320,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-jiaodong-airport",
        file: "./city/qingdao/assets/China_Railway.svg",
        x: 888,
        y: 320,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-liaoyang-east",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 1955,
        y: 1110,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-xianjiazhai",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 1748,
        y: 560,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-taihangshan",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 1050,
        y: 1818,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "coach-fenghuangshan",
        file: "./city/qingdao/assets/Long_Distance_Bus.svg",
        x: 510,
        y: 1898,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "ship-cruise-terminal",
        file: "./city/qingdao/assets/Ship.svg",
        x: 1295,
        y: 1345,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "streetcar-agricultural-university",
        file: "./city/qingdao/assets/Streetcar.svg",
        x: 1765,
        y: 335,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    }
    ];


if (typeof document !== "undefined") {
    // Sea theme colors. Manual app theme wins; when no data-theme exists yet,
    // follow the operating-system color scheme as a startup fallback.
    const styleId = "qingdao-sea-theme-style";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            :root { --qingdao-sea-color: #dceff4; }
            html[data-theme="light"] { --qingdao-sea-color: #dceff4; }
            html[data-theme="dark"] { --qingdao-sea-color: #17323b; }
            @media (prefers-color-scheme: dark) {
                html:not([data-theme]) { --qingdao-sea-color: #17323b; }
            }
            #scattered-layer .qingdao-sea-inline {
                width: 100%;
                height: 100%;
                display: block;
                color: var(--qingdao-sea-color);
                pointer-events: none;
            }
            #scattered-layer .qingdao-sea-inline .sea {
                fill: var(--qingdao-sea-color) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // SCATTERED_DATA normally renders external SVG files as <img>. For the sea only,
    // replace that image with an inline SVG after it appears. This lets the SVG use
    // page-level CSS variables, like the project's inline line badges do.
    const inlineQingdaoSea = async () => {
        const img = document.querySelector('#scattered-layer img[src*="qingdao_sea.svg"]');
        if (!img || img.dataset.qingdaoInlining === "1") return false;
        img.dataset.qingdaoInlining = "1";
        try {
            const response = await fetch(img.src);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
            const sourceSvg = parsed.documentElement;
            if (!sourceSvg || sourceSvg.nodeName.toLowerCase() !== "svg") {
                throw new Error("Invalid SVG");
            }
            const svg = document.importNode(sourceSvg, true);
            svg.classList.add("qingdao-sea-inline");
            svg.setAttribute("aria-hidden", "true");
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            img.replaceWith(svg);
            return true;
        } catch (error) {
            // Keep the original external SVG as a graceful fallback. Its own
            // prefers-color-scheme rule still follows the system theme.
            img.removeAttribute("data-qingdao-inlining");
            console.warn("[Qingdao] Sea SVG inline injection failed:", error);
            return false;
        }
    };

    const startSeaObserver = () => {
        inlineQingdaoSea().then(done => {
            if (done) return;
            const observer = new MutationObserver(async () => {
                if (await inlineQingdaoSea()) observer.disconnect();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startSeaObserver, { once: true });
    } else {
        startSeaObserver();
    }
}

if (typeof window !== "undefined") {
    window.SCATTERED_DATA = SCATTERED_DATA;
}
