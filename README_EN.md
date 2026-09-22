<p align="center">
  <img src="./assets/icons/mapicon.png" alt="CGo OpenMap Logo" width="96" height="96">
</p>

<h1 align="center">CGo OpenMap</h1>

<p align="center">
  A lightweight, modern, and highly extensible open-source interactive urban rail transit map engine for the Web.
</p>

<p align="center">
  <a href="./README.md">简体中文</a> • <strong>English</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0%20%2F%20ODbL-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/dependencies-none-brightgreen.svg" alt="Zero Dependencies">
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://qm.qq.com/q/nHfgBDS68o"><img src="https://img.shields.io/badge/QQ%20Group-619357751-12b7f5.svg" alt="QQ Group"></a>
  <img src="https://img.shields.io/badge/platform-Web%20%2F%20PWA-orange.svg" alt="Platform">
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#drunk-intelligent-map-conversion-workbench">Drunk Workbench</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#project-architecture">Architecture</a> •
  <a href="#porting-a-new-city">Porting a City</a> •
  <a href="#city-maintainers-and-acknowledgements">Maintainers</a> •
  <a href="#community">Community</a> •
  <a href="#licensing">Licensing</a>
</p>

<p align="center">
  <img src="./assets/images/screenshot-1.png" alt="CGo OpenMap interface preview" width="85%">
</p>

---

## Overview

**CGo OpenMap** is an open-source map engine focused on the visualization and interaction of urban rail transit networks.

It is built with native Web technologies and is designed to be **ready to use, lightweight, efficient, and free of build-time dependencies**. The project targets transit enthusiasts, urban-planning researchers, map makers, and front-end developers who want a customizable interactive transit-map solution.

> [!IMPORTANT]
> **Core architectural rule:** all primary map functionality must remain fully front-end and based on native Web standards. The main application must not depend on server-side Node.js applications, PM2 process management, Express/Koa backends, React/Vue/Angular application frameworks, or Vite/Webpack build pipelines.
>
> CGo OpenMap is designed around HTML5, SVG, CSS3, Vanilla JavaScript, and Web Components so it can run directly from any static Web server or hosting platform such as GitHub Pages, Cloudflare Pages, or Nginx.
>
> The only exception is a narrow class of background monitoring tasks, such as monitoring station operating status or external Web pages, where Node.js/PM2 may be used for lightweight background services. The map engine and all major interactive map features must remain native front-end code.

The repository currently includes complete or reference implementations for **Beijing, Shenyang, Dalian, Changchun, Qingdao, Hefei, Fuzhou, Shanghai, and Sydney**. The common rendering engine is separated from city-specific business data, so new cities can be ported by following the standardized data model without rewriting the core renderer.

The project also includes **Drunk**, an intelligent transit-map conversion workbench. It can take a high-resolution image, vector PDF, or Adobe Illustrator project and help convert it into CGo OpenMap city data through vector parsing, AI-assisted topology recognition, knowledge-base matching, visual editing, and code export.

---

## Key Features

- **Pure front-end, zero framework dependency** — built with HTML5, native SVG, Vanilla JavaScript, Web Components, and CSS variables. No bundler or build pipeline is required for the core application.
- **Drunk intelligent conversion workbench** — a full or semi-automatic mapping workspace under `drunk/`. It supports raster images, vector/scanned PDFs, and Adobe Illustrator files, plus AI-assisted topology recognition, Wikipedia-based station-name correction, an eight-direction label placement control, 45°/90° snapping, and standardized city-code export.
- **Native vector interaction** — smooth zooming, free panning, viewport boundary control, mouse-wheel support, and mobile multi-touch gestures, all rendered through SVG.
- **Light and dark themes** — automatically follows system preferences or can be manually locked to a theme, with crisp vector rendering on high-DPI displays.
- **Multi-dimensional station search** — supports Chinese and English station names, full Pinyin, Pinyin initials, polyphonic characters, aliases, and former station names.
- **Modular station information boards** — the registration-based architecture in `core/station-board.js` allows each city to enable, reorder, or extend modules for tourism guidance, timetables, estimated arrivals, transfer walking guidance, bus/taxi connections, platform layouts, elevators, nursing rooms, AED locations, and other local services.
- **Detailed station and line models** — supports transfer information, operator information, exits, platform and stair diagrams, first/last train interfaces, time-limited virtual transfers, and geographic-distance-assisted map spacing.
- **Location-aware assistance** — uses the browser Geolocation API to estimate nearby stations and direct distance, and can hand off to external navigation or railway services.
- **City-specific branding** — each city can register its own `themeColor` and official vector logo. Theme palettes are derived per city and remain isolated to avoid cross-city style leakage.
- **Decoupled multi-city architecture** — the core renderer under `core/` is separated from city-specific configuration under `city/`, making it possible to add a city without modifying the rendering engine.
- **PWA and offline support** — includes a Service Worker caching strategy and Web App Manifest so the project can be installed and used offline on mainstream desktop and mobile platforms.

---

## Quick Start

Because the project uses ES Modules and a Service Worker, it should be served over HTTP or HTTPS.

### 1. Clone the repository

```bash
git clone https://github.com/CGo-Project/CGo-OpenMap.git
cd CGo-OpenMap
```

### 2. Start any static HTTP server

**VS Code**

Install the Live Server extension and choose **Go Live**, or open `index.html` / `main.html` with Live Server.

**Node.js**

```bash
npx serve .
```

**Python 3**

```bash
python3 -m http.server 8080
```

### 3. Open the application

Visit `http://localhost:8080`, or the port shown by your static server.

> [!TIP]
> **Service Worker caching during development:** after changing code or city data, increment `CACHE_NAME` in `sw.js`. If a change appears to have no effect, first check whether the Service Worker is serving an older cached asset. During debugging, you can enable **Disable cache** in the browser DevTools Network panel or use a hard refresh.

---

## Drunk: Intelligent Map Conversion Workbench

> [!WARNING]
> **Early development / validation status:** Drunk is currently in an early Beta stage and should be treated as an experimental tool. Recognition algorithms, layer parsing, and data structures are still evolving, and exported results should be manually reviewed. Contributions to its algorithms and interactions are very welcome.

**Drunk** is CGo OpenMap's map vectorization, migration, and visual editing workbench. After starting a local static server, open `http://localhost:8080/drunk/`.

### What problem does it solve?

Traditionally, porting a city requires manually measuring hundreds or thousands of station coordinates, adjusting label alignment station by station, and connecting every line by hand.

Drunk turns that workflow into:

**Upload source map → intelligent extraction → visual adjustment → one-click project export**

### Main capabilities

- **Multi-format source-map input** — supports high-resolution PNG/JPG files, vector/scanned PDFs, and Adobe Illustrator (`.ai`) projects, including extraction of OCG layers, XMP palettes, and text layers where available.
- **AI-assisted topology recognition** — can use a multimodal vision model to infer network topology from a source map.
- **Wikipedia knowledge matching** — dynamically matches station names against reference entries and uses fuzzy matching to correct Chinese/English naming issues.
- **WYSIWYG fine-tuning** — compare against a translucent source map, drag stations directly, use the eight-direction label control, and apply 45°/90° snapping.
- **Standard CGo OpenMap export** — generates city project files such as `data_stations.js`, `data_lines.js`, `data_legend.js`, and the city-level logic file.
- **Recognition cleanup and geometric correction** — filters map noise, cleans malformed station names, merges duplicate transfer stations, removes degenerate lines, and can pull skewed recognition results back toward the source-map geometry.

### Edit mode for existing cities

Drunk is also the visual editor for any registered OpenMap city.

You can enter edit mode from:

- **More → Preferences → Edit this map → Open edit mode** on the transit map;
- the city selector in the Drunk toolbar, followed by **Edit this map**;
- `drunk/index.html?city={city_id}`.

**Stations:** drag stations, edit Chinese/English names, switch station types, rotate label placement with the eight-direction control, fine-tune label offsets with `Alt + arrow keys`, or delete a station.

**Lines:** select a legend item or a line on the canvas, then edit its name, color, or operator. Route control points can be dragged, inserted by double-clicking a line, or deleted.

**Corner radius:** route bends expose editable handles. Radius values can be set manually or through presets. The workbench and the live renderer share the same geometry implementation in `core/path-geometry.js`, so editing is intended to be WYSIWYG.

Keyboard shortcuts: **Ctrl/Cmd + Z** to undo, **Ctrl/Cmd + S** to export, and **Esc** to clear selection.

> **Entry-level lossless source rewriting:** only the entries actually changed by the editor are rewritten. Unmodified entries keep their comments, indentation, property order, and hand-formatted line breaks. This minimizes diff noise and helps protect manually calibrated city data.

---

## Documentation

| Audience / task | Resource | Description |
| :--- | :--- | :--- |
| New users | [QUICKSTART.md](./QUICKSTART.md) | Beginner-friendly environment setup and AI-assisted development guide |
| Intelligent conversion and visual editing | [Drunk Workbench](./drunk/index.html) | Raster/vector conversion, AI-assisted extraction, and editing existing cities |
| AI-assisted development | [AGENTS.md](./AGENTS.md) | Architecture rules, decoupling requirements, and data conventions for coding agents |
| Porting city data | [PORTING.md](./PORTING.md) | City data structures, coordinates, lines, and legend configuration |
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution workflow, city-maintainer model, and pull-request checklist |

The supporting documents are currently primarily written in Chinese. English translations can be added incrementally as the international contributor community grows.

---

## Project Architecture

The repository separates the core engine, conversion/editing tools, and city data.

```text
openmap/
├── index.html                  # Landing page and city directory
├── main.html                   # Main SVG transit-map canvas
├── README.md                   # Chinese README
├── README_EN.md                # English README
├── LICENSE                     # Dual licensing details
├── CONTRIBUTING.md             # Contribution and maintainer guide
├── AGENTS.md                   # AI coding and architecture rules
├── QUICKSTART.md               # Beginner guide
├── PORTING.md                  # City-porting guide
├── readme.html                 # In-app project/help page
├── privacy.html                # Privacy notice
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
├── drunk/                      # Conversion workbench and city editor
├── core/                       # Shared multi-city rendering engine
├── city/                       # City-specific data and behavior
│   ├── data.js                 # CITY_REGISTRY
│   ├── beijing/
│   ├── changchun/
│   ├── dalian/
│   ├── fuzhou/
│   ├── hefei/
│   ├── qingdao/
│   ├── shanghai/
│   ├── shenyang/
│   └── sydney/
├── css/                        # Shared styles and theme variables
└── assets/                     # Icons, line badges, screenshots, and other static assets
```

---

## Porting a New City

There are two supported workflows.

### Recommended: use Drunk

1. Start a local static server and open `http://localhost:8080/drunk/`.
2. Upload an official transit-map image, PDF, or Illustrator file.
3. Run visual recognition or vector parsing.
4. Adjust stations and labels on the canvas and use snapping where appropriate.
5. Export the city project into `city/{city_id}/`.
6. Register the city in `city/data.js`.
7. Add required offline assets and increment the cache version in `sw.js`.
8. Review the generated result manually before submitting.

After a city is online, the same Drunk workbench can be used for day-to-day maintenance such as moving stations, correcting names, or adjusting label directions.

### Traditional manual workflow

1. Create a city folder such as `city/guangzhou/` based on an existing implementation.
2. Add the city to `CITY_REGISTRY` in `city/data.js`.
3. Define stations in `data_stations.js`, including unique IDs, coordinates, Chinese/English names, and label alignment.
4. Define line sequences, `stationIds`, route geometry, and line colors in `data_lines.js`.
5. Reuse or add vector route badges in `assets/svg/`.
6. Optionally create local station-board modules under `city/{city_id}/modules/`.
7. Add PWA shortcuts and Service Worker assets where required.
8. Validate the result locally in both light and dark themes.

For detailed conventions, see [PORTING.md](./PORTING.md).

---

## City Maintainers and Acknowledgements

CGo OpenMap follows an **open collaboration + city stewardship** model. Contributors who complete or continuously maintain a city's data can be recognized as official city maintainers. Their names and profile links may appear in the application, documentation, and city registry.

- **Beijing:** [NaL](https://github.com/NokiaimuL/) — City Maintainer; SierraQin — operations-data support; Freedom Space — suburban railway review
- **Shenyang:** [jrzhang](https://github.com/beepingflijo) — City Maintainer; 从恒隆到细河 — operations-data support
- **Qingdao:** [YoTra青通](https://github.com/YoTraYoungTraffic) — City Maintainer
- **Hefei:** [Evin](https://github.com/walternie) — City Maintainer
- **Shanghai:** [Ryan Si](https://github.com/ryan-si) — City Maintainer
- **Dalian:** [jrzhang](https://github.com/beepingflijo) — City Maintainer; duckinglim — operations-data support
- **Changchun:** [jrzhang](https://github.com/beepingflijo) — City Maintainer
- **Sydney:** [Ryan Si](https://github.com/ryan-si) — City Maintainer
- **Platform architecture:** [NaL](https://github.com/NokiaimuL/) & [Ryan](https://github.com/ryan-si)
- **Geographic data:** [Amap / Gaode Maps Open Platform](https://lbs.amap.com/)

The core engine will continue to evolve. New city implementations are encouraged to be contributed upstream through pull requests so they can benefit from future compatibility updates and data migrations.

---

## Community

CGo OpenMap welcomes transit enthusiasts, front-end developers, city-data maintainers, and anyone interested in building better open transit maps.

- **Official QQ group:** 619357751
- **Join link:** https://qm.qq.com/q/nHfgBDS68o

<p align="center">
  <img src="./assets/images/qq.png" alt="CGo OpenMap official QQ group QR code" width="220">
  <br>
  <em>Scan to join the CGo OpenMap community (QQ Group 619357751)</em>
</p>

Issues and pull requests on GitHub are also welcome for technical discussion, bug reports, map corrections, and feature proposals.

---

## Licensing

CGo OpenMap uses a dual-track licensing model that separates the software engine from city data. See [LICENSE](./LICENSE) for details.

1. **Core engine and interaction code** — including `core/`, `css/`, `index.html`, and `main.html` — is licensed under **GNU AGPLv3**. Network-deployed derivative services must make the corresponding source code available to users as required by the license.
2. **City maps and business data** under `city/` are shared under **ODbL 1.0** and **CC BY-SA 4.0** as described by the project license terms.
3. **Third-party intellectual property** — official transit logos, line names, brand colors, and operating data remain the property of their respective operators or rights holders.

---

<p align="center">
  Built for open, maintainable, community-driven urban rail transit maps.
</p>
