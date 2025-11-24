# WriteTyper

Like a typewriter, but for writing! Generate handwriting text as SVG paths for artwork, plotters, and laser cutters.

## Features

- 🖊️ **Hershey Font Support** - Native support for single-stroke plotter fonts (.jhf format)
- 🔤 **OpenType/TrueType** - Load any TTF/OTF font from your system
- ⚡ **Real-time Preview** - See your handwriting as you type
- 📤 **Export Options** - Save as SVG or JSON coordinate data
- 🎨 **Artwork Ready** - Perfect for combining with other vector artwork

## Installation

```bash
git clone <your-repo-url>
cd writetyper
npm install
```

## Usage

### Development

```bash
npm run dev
```

This starts both Vite (for hot-reload React) and Electron.

### First Run

On first launch, WriteTyper automatically:
1. Creates `~/writetyper/` directory in your home folder
2. Downloads Hershey fonts from GitHub
3. Saves fonts to `~/writetyper/hershey-fonts/`

This happens once - subsequent runs use the cached fonts.

### Using Hershey Fonts

1. Click "Load Font"
2. Browse to `~/writetyper/hershey-fonts/hershey-fonts/`
3. Select a `.jhf` file (e.g., `futural.jhf`, `scripts.jhf`)
4. Start typing!

Popular Hershey fonts:
- `futural.jhf` - Clean sans-serif (like Futura)
- `scripts.jhf` - Cursive/script style
- `cursive.jhf` - Handwriting style
- `timesr.jhf` - Times Roman
- `rowmans.jhf` - Roman Simplex

### Using Custom Fonts

1. Click "Load Font"
2. Select any `.ttf` or `.otf` file from your system
3. Type and generate paths!

Note: Regular fonts have filled outlines. For single-stroke paths, use Hershey fonts.

## Workflow

1. **Generate** - Load font and type your text
2. **Preview** - See real-time SVG preview
3. **Adjust** - Change font size (12-200px)
4. **Export** - Save as SVG or JSON
5. **Integrate** - Import SVG into Inkscape, Illustrator, or plotter software

## Export Formats

### SVG
Perfect for:
- Importing into Inkscape/Illustrator
- Direct plotter input (via vpype, Lightburn, etc.)
- Combining with other vector artwork

### JSON
Coordinate data for:
- Programmatic manipulation
- Custom processing pipelines
- Direct plotter control

## Architecture

```
WriteTyper (Electron + React + Vite)
├── electron/
│   ├── main.cjs          # Main process (Node.js, CommonJS)
│   └── preload.cjs       # IPC bridge (secure)
├── src/
│   ├── App.jsx           # React UI
│   └── main.jsx          # React entry
└── ~/writetyper/         # User's home directory
    └── hershey-fonts/    # Auto-downloaded on first run
```

**Why CommonJS for Electron?**
- Preload scripts work reliably with CommonJS
- No ES module loading issues
- Battle-tested pattern

**Why separate from renderer?**
- Security: Renderer is sandboxed
- Clean separation: UI code is Electron-agnostic
- Performance: Font processing in main thread

## Development Notes

### JHF Parser

WriteTyper includes a native Hershey JHF parser that:
- Reads the Jim Hershey Font format directly
- Converts coordinate pairs to SVG paths
- Handles pen-up/pen-down commands
- Scales fonts appropriately

No external conversion tools needed!

### Font Auto-Download

On first run, WriteTyper:
1. Checks if `~/writetyper/hershey-fonts/` exists
2. If not, runs `git clone` to download fonts
3. Falls back gracefully if git is not available
4. Only downloads once (cached for future use)

### File Dialog

The "Load Font" dialog automatically opens to:
- `~/writetyper/hershey-fonts/hershey-fonts/` if it exists
- `~/writetyper/` otherwise
- Makes finding Hershey fonts easy!

## Building for Distribution

```bash
npm run build        # Build with electron-builder
```

Outputs platform-specific installers in `dist/`.

## Git Ignore

The following are gitignored:
- `node_modules/`
- `dist/`
- `resources/fonts/*.jhf` (local font copies)
- `.vite/`, `.DS_Store`, etc.

User's `~/writetyper/` directory is outside the repo (not committed).

## Troubleshooting

**Fonts not downloading?**
- Check internet connection
- Ensure git is installed: `git --version`
- Manually clone: `git clone https://github.com/kamalmostafa/hershey-fonts.git ~/writetyper/hershey-fonts`

**Electron won't start?**
- Check Node version: `node --version` (requires 20+)
- Kill existing processes: `pkill -f electron`
- Restart: `npm run dev`

**Paths look wrong?**
- Hershey fonts work best at 72px+
- Regular fonts create filled outlines (use Hershey for single-stroke)

## Credits

- **Hershey Fonts**: https://github.com/kamalmostafa/hershey-fonts
- Built with Electron, React, and Vite
- JHF parser written from scratch for this project

## License

MIT
