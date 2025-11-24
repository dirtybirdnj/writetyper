# Handwriting Text Generator

Desktop app for generating handwriting text as SVG paths for artwork integration. Built with Electron, React, and opentype.js.

## Features

- **Font Support**: Load Hershey single-stroke fonts or custom TrueType/OpenType fonts
- **Real-time Preview**: Live canvas preview with zoom controls
- **SVG Path Generation**: Extract clean vector paths from fonts
- **Export Formats**: SVG for direct artwork integration, JSON for coordinate data
- **Artwork-Ready**: Generates single-stroke paths perfect for plotters, laser cutters, or vector artwork

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  MAIN PROCESS (Node.js)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ • App lifecycle management                       │  │
│  │ • File system access (fonts, exports)            │  │
│  │ • Font processing (opentype.js)                  │  │
│  │ • IPC handlers for UI requests                   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │ IPC (contextBridge)
                       │
┌──────────────────────▼───────────────────────────────────┐
│              RENDERER PROCESS (React)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ • Font selector (Hershey/Custom)                 │  │
│  │ • Text input & settings                          │  │
│  │ • Canvas preview with zoom                       │  │
│  │ • Export panel (SVG/JSON)                        │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Project Structure

```
handwriting-plotter/
├── src/
│   ├── main/
│   │   ├── index.js              # Main process entry point
│   │   ├── preload.js            # IPC bridge (security layer)
│   │   └── utils/
│   │       ├── fontProcessor.js  # Font loading & path generation
│   │       └── pathOptimizer.js  # Path optimization logic
│   ├── renderer/
│   │   ├── index.html            # HTML entry
│   │   ├── index.jsx             # React entry point
│   │   ├── App.jsx               # Main application component
│   │   ├── App.css               # Global styles
│   │   └── components/
│   │       ├── FontSelector.jsx  # Font selection UI
│   │       ├── TextInput.jsx     # Text input & settings
│   │       ├── PreviewCanvas.jsx # SVG preview with zoom
│   │       └── ExportPanel.jsx   # Export controls
│   └── resources/
│       └── fonts/                # Bundled Hershey fonts (to be added)
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
cd handwriting-plotter
npm install
```

### Development

Start the app with a single command:

```bash
cd handwriting-plotter
npm run dev
```

This will:
1. Start the Vite dev server (React hot-reload)
2. Wait for Vite to be ready
3. Launch Electron automatically
4. Open DevTools for debugging

### Building for Production

```bash
npm run build        # All platforms
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

## Usage

1. **Select a Font**
   - Choose "Hershey" tab for single-stroke fonts (ideal for plotters)
   - Choose "Custom Font" to load your own TTF/OTF files

2. **Enter Text**
   - Type your text in the input field
   - Adjust font size with the slider or presets (24px - 200px)

3. **Preview**
   - View real-time preview as you type
   - Use zoom controls (+/-) to inspect details
   - Paths update automatically with 300ms debounce

4. **Export**
   - **SVG**: Import into Inkscape, Illustrator, or send to plotter software
   - **JSON**: Coordinate data for custom processing or programmatic artwork
   - **Copy**: Quick clipboard copy for pasting into other tools

## Workflow for Plotter/Laser Integration

1. Generate handwriting text in this app
2. Export as SVG
3. Import SVG into your artwork tool (Inkscape, Illustrator, etc.)
4. Combine with other artwork elements
5. Use existing tools (vpype, Lightburn, etc.) for G-code conversion
6. Send to your plotter/laser cutter

This app focuses solely on clean handwriting path generation - other tools handle machine-specific optimization.

## Adding Hershey Fonts

Download Hershey fonts in SVG format and place them in `resources/fonts/`:

```bash
# Example Hershey font sources:
# - https://github.com/kamalmostafa/hershey-fonts
# - https://en.wikipedia.org/wiki/Hershey_fonts
```

Expected format: `fontname.svg` with glyph elements:
```xml
<glyph unicode="A" d="M 0,0 L 10,20 L 20,0" />
```

## Note on Optimization

This app generates clean SVG paths without optimization. If you need path optimization for your plotter:

- Use [vpype](https://github.com/abey79/vpype) externally: `vpype read input.svg linemerge linesort write output.svg`
- Use your plotter software's built-in optimization
- Use Inkscape extensions for path optimization

The app intentionally avoids optimization to maintain flexibility for different use cases.

## Security

This app follows Electron security best practices:

- **Context Isolation**: Renderer process isolated from Node.js
- **Sandboxing**: Renderer runs in sandbox mode
- **No Node Integration**: Node.js disabled in renderer
- **Preload Script**: Safe IPC bridge via contextBridge
- **CSP Headers**: Content Security Policy enabled

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Electron 32 | Native desktop app |
| Frontend | React 18 | UI components & state |
| Build Tool | Vite 5 | Fast dev server & bundling |
| Font Processing | opentype.js | TTF/OTF parsing & path extraction |

## Roadmap

Current Features:
- [x] Core architecture
- [x] Font loading (OpenType + Hershey)
- [x] SVG path generation
- [x] Canvas preview with zoom
- [x] SVG/JSON exports
- [x] Single-command dev startup

Planned Enhancements:
- [ ] Bundle popular Hershey fonts
- [ ] Multi-line text layout
- [ ] Letter spacing controls
- [ ] Line height adjustment
- [ ] Custom stroke width preview
- [ ] Batch text processing
- [ ] Font preview gallery
- [ ] Path statistics (total length, pen-up distance)

## Troubleshooting

**App won't start:**
- Check Node.js version: `node --version` (should be 20+)
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Fonts not loading:**
- Ensure font files are valid TTF/OTF or SVG format
- Check console for error messages (View > Toggle Developer Tools)

**Preview not rendering:**
- Verify SVG generation in exported files
- Check browser console in DevTools

**Optimization not working:**
- Install vpype: `pip install vpype`
- Verify vpype is in PATH: `vpype --version`

## Contributing

This is a starter boilerplate. Feel free to:
- Add more export formats (G-code, HPGL)
- Improve path optimization algorithms
- Add UI improvements
- Create plotter presets
- Extend font support

## License

MIT

## Acknowledgments

- [opentype.js](https://opentype.js.org/) - Font parsing
- [vpype](https://github.com/abey79/vpype) - Plotter optimization
- [Hershey Fonts](https://en.wikipedia.org/wiki/Hershey_fonts) - Single-stroke fonts
- Inspired by plotter art community
