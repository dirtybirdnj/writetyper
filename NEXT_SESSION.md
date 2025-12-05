# WriteTyper - Next Session Notes

## Current State (December 2024)

WriteTyper is an Electron-based desktop app for generating plotter-ready SVG text from various font formats. It's designed for pen plotters, Cricut machines, and similar devices.

### Features Implemented

1. **Font Support**
   - Hershey JHF fonts (single-stroke vector fonts)
   - SVG fonts (.svg with `<font>` elements)
   - OpenType fonts (.ttf/.otf) - converted to stroke paths

2. **UI Controls**
   - Font selection with preview modal
   - Font size (1-999pt with decimal precision)
   - Character spacing multiplier
   - Stroke width
   - Page size presets (4x6, 5x8, 8x12, 9x12, 12x18, 12x24)
   - Page rotation (portrait/landscape)
   - **Page margins (top, right, bottom, left)** - newly added

3. **Export Options**
   - SVG export (with proper inch dimensions for plotters)
   - PNG export
   - JPG export
   - Copy SVG to clipboard
   - **Font samples export** - single-page PDF with all 47 fonts in 3-column layout

4. **OCR Integration**
   - Upload images and extract text via Tesseract.js
   - Auto-selects appropriate page size based on text length

5. **Glyph Template Generator**
   - Creates printable templates for capturing handwritten glyphs
   - A5 size with crop marks for Repaper tablet workflow

### Known Issues

1. **Text positioning bug**: When switching between different font types (Hershey, SVG, OpenType), text may render off-screen. Each font type has different coordinate system assumptions:
   - Hershey: Centered around origin, spans ~-8 to +8 in X
   - SVG fonts: Y-up coordinate system, glyphs relative to baseline
   - OpenType: Standard font metrics with ascent/descent

2. **Font-type defaults**: Different font types should have different default settings (stroke width, spacing, etc.) but currently share the same defaults.

### Architecture

```
writetyper/
├── electron/
│   ├── main.cjs          # Electron main process, IPC handlers, SVG generation
│   └── preload.cjs       # Context bridge for renderer
├── src/
│   ├── App.jsx           # Main React component
│   └── index.css         # Styles
├── fonts/                # Font files
│   ├── hershey/          # .jhf files
│   ├── svg/              # .svg font files
│   └── ttf/              # OpenType fonts
└── samples/              # Sample images for OCR
```

### Key Functions (main.cjs)

- `parseJHF()` - Parse Hershey JHF font format
- `parseSVGFont()` - Parse SVG font files
- `generateHersheySVG()` - Generate SVG for Hershey fonts
- `generateSVGFontSVG()` - Generate SVG for SVG fonts
- `generateSVG()` - Generate SVG for OpenType fonts
- `generateFontSamplesSVG()` - Create font samples document
- `renderTextAsPath()` - Render text labels as paths (for plotter-ready output)

---

## Next Steps

### 1. Expand Font Library

**More Handwriting Styles**
- Look into SVG font repositories
- Convert popular handwriting TTFs to single-stroke versions
- Explore Hershey font extensions/variants

**Font Sources to Investigate**
- [EMS fonts](https://www.emsfonts.com/) - Already have EMS Delight, Tech, etc.
- [Hershey font variants](https://paulbourke.net/dataformats/hershey/)
- [Google Fonts handwriting category](https://fonts.google.com/?category=Handwriting) - would need stroke extraction
- [CNC/plotter font communities](https://www.cnczone.com/)

**Font Conversion Pipeline**
- Research tools for converting filled fonts to single-stroke
- Potrace for bitmap-to-vector
- Centerline tracing algorithms
- FontForge scripting for batch processing

### 2. Rust CLI Tool

Create a standalone Rust package for:
- Parsing font files (JHF, SVG fonts, OpenType)
- Generating SVG path data
- Batch processing text files
- Integration with other tools

**Proposed CLI Interface**
```bash
# Basic usage
writetyper-cli "Hello World" --font ./fonts/hershey/cursive.jhf -o output.svg

# Batch processing
writetyper-cli --input texts.txt --font ./fonts/svg/delight.svg --output-dir ./output/

# Options
--font, -f          Font file path
--size, -s          Font size in points (default: 72)
--spacing           Character spacing multiplier (default: 1.0)
--stroke-width      Stroke width (default: 2)
--page-size         Page size (e.g., "4x6", "letter", "a4")
--margins           Page margins "top,right,bottom,left" in inches
--output, -o        Output file path
--format            Output format: svg, json, gcode
```

**Rust Crate Structure**
```
writetyper-core/
├── src/
│   ├── lib.rs
│   ├── fonts/
│   │   ├── hershey.rs    # JHF parser
│   │   ├── svg.rs        # SVG font parser
│   │   └── opentype.rs   # OpenType wrapper
│   ├── render/
│   │   ├── svg.rs        # SVG output
│   │   ├── gcode.rs      # G-code output (for CNC)
│   │   └── path.rs       # Path primitives
│   └── text/
│       └── layout.rs     # Text layout engine
└── Cargo.toml

writetyper-cli/
├── src/
│   └── main.rs
└── Cargo.toml
```

**Dependencies to Consider**
- `ttf-parser` or `rusttype` for OpenType
- `svg` crate for SVG generation
- `clap` for CLI argument parsing
- `rayon` for parallel batch processing

### 3. Additional Features

**Short Term**
- [ ] Fix text positioning bug when switching font types
- [ ] Add font-type-specific default settings
- [ ] Add line height control
- [ ] Add text alignment (left, center, right)
- [ ] Add word wrap with configurable width

**Medium Term**
- [ ] Custom font import (drag & drop)
- [ ] Font preview in dropdown
- [ ] Undo/redo support
- [ ] Save/load project files
- [ ] G-code export for CNC plotters

**Long Term**
- [ ] Custom glyph editor (draw your own characters)
- [ ] Machine learning for handwriting style transfer
- [ ] Web version (WebAssembly with Rust core)
- [ ] Plugin system for custom output formats

### 4. Font Creation Workflow

For creating new handwriting fonts:
1. Generate glyph template (existing feature)
2. Write on Repaper tablet / print and write by hand
3. Scan/capture the written glyphs
4. Process with vectorization tool
5. Assemble into font file (SVG or custom format)

**Tools to Integrate/Research**
- Potrace (bitmap to vector)
- Autotrace (centerline extraction)
- FontForge (font assembly)
- Inkscape (vector editing, has some centerline tools)

---

## Development Notes

### Running the App
```bash
npm install
npm run dev
```

### Building
```bash
npm run build
npm run package  # Creates distributable
```

### Testing Fonts
The font menu (gear icon or Cmd+F) shows a preview of all fonts with the pangram "The quick brown fox jumps over the lazy dog".

### Export Font Samples
Use Cmd+Shift+F to export a single-page document showing all fonts with the pangram "Sphinx of black quartz, judge my vow" - useful for choosing fonts and as a test print.
