# WriteTyper Rust CLI - Implementation Plan

## Overview

A standalone Rust CLI tool for generating single-line vector text, mirroring the architecture of [rat-king](https://github.com/dirtybirdnj/rat-king). This tool converts text to plotter-ready SVG paths using various single-stroke font formats.

## Goals

1. **Headless text rendering** - Generate SVG from text without GUI
2. **Service integration** - Pipe-friendly for shell scripts and other tools
3. **Portable binaries** - Static builds for macOS/Linux, no runtime deps
4. **Font format support** - Hershey JHF, SVG fonts (OpenType later)

## Architecture

### Workspace Structure

```
writetyper/
├── crates/
│   ├── Cargo.toml                    # Workspace configuration
│   │
│   ├── writetyper-core/              # Core library (no CLI deps)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs                # Public API exports
│   │       ├── fonts/
│   │       │   ├── mod.rs            # Font trait + types
│   │       │   ├── hershey.rs        # JHF parser
│   │       │   └── svg_font.rs       # SVG <font> parser
│   │       ├── geometry.rs           # Point, Line, Path types
│   │       ├── layout.rs             # Text layout engine
│   │       └── output/
│   │           ├── mod.rs
│   │           ├── svg.rs            # SVG generation
│   │           └── json.rs           # JSON coordinate export
│   │
│   └── writetyper-cli/               # CLI binary
│       ├── Cargo.toml
│       └── src/
│           ├── main.rs               # Entry point + arg routing
│           └── cli/
│               ├── mod.rs            # Command modules
│               ├── render.rs         # `writetyper render` command
│               ├── fonts.rs          # `writetyper fonts` command
│               └── samples.rs        # `writetyper samples` command
```

### Design Principles (from rat-king)

1. **Manual CLI parsing** - No heavy framework (no clap), simple match-based routing
2. **Library/binary separation** - Core logic in library crate, CLI is thin wrapper
3. **Streaming output** - Write to stdout by default, `-o` for file
4. **Multiple output formats** - SVG (default), JSON for tool integration
5. **Stateless functions** - Pure functions for all generation logic

## CLI Interface

### Commands

```bash
# Render text to SVG
writetyper render "Hello World" [OPTIONS]

# List available fonts
writetyper fonts [--json]

# Generate font samples document
writetyper samples [OPTIONS]

# Show help
writetyper --help
writetyper render --help
```

### Render Command Options

```
writetyper render <TEXT> [OPTIONS]

Arguments:
  <TEXT>                    Text to render (use - for stdin)

Options:
  -f, --font <PATH>         Font file path (required)
  -s, --size <PT>           Font size in points [default: 72]
  -c, --spacing <MULT>      Character spacing multiplier [default: 1.0]
  -w, --stroke-width <PX>   Stroke width [default: 2.0]
  -p, --page-size <SIZE>    Page size: 4x6, 5x8, 8x12, 9x12, 12x18, 12x24, letter, a4
  -m, --margins <T,R,B,L>   Page margins in inches [default: 0,0,0,0]
  -o, --output <FILE>       Output file (default: stdout)
  --format <FMT>            Output format: svg, json [default: svg]
  --stroke-color <HEX>      Stroke color [default: #000000]
```

### Examples

```bash
# Basic usage
writetyper render "Hello" -f fonts/hershey/futural.jhf

# Full options
writetyper render "Dear friend," \
  --font ./resources/fonts/ems/EMSDelight.svg \
  --size 48 \
  --spacing 1.2 \
  --stroke-width 0.5 \
  --page-size 8x12 \
  --margins "0.5,0.5,0.5,0.5" \
  -o letter.svg

# Stdin input for multiline
cat letter.txt | writetyper render - -f cursive.jhf -o output.svg

# JSON output for integration
writetyper render "Test" -f futural.jhf --format json | jq '.paths'

# List fonts as JSON
writetyper fonts --json

# Font samples sheet
writetyper samples -o samples.svg --text "Custom sample text"
```

## Core Types

### Geometry (geometry.rs)

```rust
#[derive(Debug, Clone, Copy)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone)]
pub struct Path {
    pub points: Vec<Point>,
    pub closed: bool,
}

#[derive(Debug, Clone)]
pub struct Glyph {
    pub paths: Vec<Path>,
    pub advance_width: f64,
    pub left_bearing: f64,
}
```

### Font Trait (fonts/mod.rs)

```rust
pub trait Font {
    fn glyph(&self, c: char) -> Option<&Glyph>;
    fn units_per_em(&self) -> f64;
    fn ascender(&self) -> f64;
    fn descender(&self) -> f64;
    fn line_height(&self) -> f64;
}

pub enum FontData {
    Hershey(HersheyFont),
    SvgFont(SvgFont),
}
```

### Layout (layout.rs)

```rust
pub struct LayoutOptions {
    pub font_size: f64,           // Points
    pub char_spacing: f64,        // Multiplier
    pub line_height: f64,         // Multiplier
    pub page_width: Option<f64>,  // Inches (for word wrap)
    pub page_height: Option<f64>,
    pub margins: Margins,
}

pub struct RenderedText {
    pub paths: Vec<Path>,
    pub bounds: BoundingBox,
    pub line_count: usize,
}

pub fn layout_text(text: &str, font: &dyn Font, options: &LayoutOptions) -> RenderedText;
```

## Font Parsers

### Hershey JHF Format

The JHF format stores single-stroke vector glyphs:

```
   49 12MWOMOV RUMUV ROQUQ
   ^^^^
   char code (ASCII - offset)
      ^^
      vertex count
        ^
        left/right bounds encoded as chars
          ^^^^^^^^^^^^^^^^
          vertex pairs: R=pen up, otherwise relative coords
```

Key parsing logic from main.cjs:
- Characters offset by 'R' (ASCII 82) for coordinates
- ' R' sequence means pen-up (move without drawing)
- Bounds encoded as single chars relative to 'R'

### SVG Font Format

SVG fonts use `<font>` elements with `<glyph>` children:

```xml
<font id="MyFont">
  <font-face units-per-em="1000" ascent="800" descent="-200"/>
  <glyph unicode="A" horiz-adv-x="600" d="M0 0L300 700L600 0M100 300L500 300"/>
</font>
```

Key parsing:
- Extract `<glyph>` elements by unicode attribute
- Parse SVG path `d` attribute
- Handle Y-flip (SVG fonts are Y-up, output needs Y-down)

## Output Formats

### SVG Output

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="8in" height="12in"
     viewBox="0 0 768 1152">
  <g stroke="#000000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10,100 L20,50 L30,100"/>
    <path d="M40,100 L40,50 L60,50 L60,75 L40,75"/>
  </g>
</svg>
```

### JSON Output

```json
{
  "text": "Hello",
  "font": "futural.jhf",
  "options": {
    "size": 72,
    "spacing": 1.0,
    "strokeWidth": 2.0
  },
  "bounds": {
    "minX": 0,
    "minY": 0,
    "maxX": 250,
    "maxY": 72
  },
  "paths": [
    {"points": [{"x": 10, "y": 100}, {"x": 20, "y": 50}], "closed": false},
    {"points": [{"x": 40, "y": 100}, {"x": 40, "y": 50}], "closed": false}
  ]
}
```

## Implementation Phases

### Phase 1: Core Library

1. Set up Cargo workspace
2. Implement `geometry.rs` types
3. Port `parseJHF()` from main.cjs → `hershey.rs`
4. Port `parseSVGFont()` from main.cjs → `svg_font.rs`
5. Implement basic `layout_text()` function
6. Implement SVG output generator
7. Unit tests for parsers

### Phase 2: CLI Binary

1. Set up writetyper-cli crate
2. Implement manual argument parsing (rat-king style)
3. `render` command with all options
4. `fonts` command (scan directories)
5. JSON output mode
6. Stdin support for text input

### Phase 3: Distribution

1. Copy GitHub Actions workflow from rat-king
2. Build targets: macOS arm64, macOS x86_64, Linux x86_64
3. Create releases with binaries
4. Update README with installation instructions

### Phase 4: Enhancements (Optional)

1. OpenType support via `ttf-parser` crate
2. G-code output for CNC machines
3. TUI preview mode (ratatui)
4. Batch file processing
5. Font info command

## Dependencies

### writetyper-core

```toml
[dependencies]
# Minimal - no runtime deps for core library
```

### writetyper-cli

```toml
[dependencies]
writetyper-core = { path = "../writetyper-core" }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

## Reference: Existing JavaScript Implementation

Key functions to port from `electron/main.cjs`:

| Function | Lines | Purpose |
|----------|-------|---------|
| `parseJHF()` | 328-369 | Hershey font parser |
| `parseHersheyCoords()` | 371-406 | JHF coordinate decoder |
| `parseSVGFont()` | 264-326 | SVG font parser |
| `generateHersheySVG()` | 1273-1349 | Hershey → SVG |
| `generateSVGFontSVG()` | 1199-1271 | SVG font → SVG |

## Comparison with rat-king

| Aspect | rat-king | writetyper-cli |
|--------|----------|----------------|
| Input | SVG files with polygons | Text strings |
| Output | Fill patterns (lines) | Text paths (strokes) |
| Generators | 30+ pattern algorithms | 2-3 font parsers |
| TUI | Full interactive preview | None (headless first) |
| Primary use | Polygon fills | Text rendering |
| Shared | Workspace structure, CLI style, SVG output, JSON output |
