# WriteTyper Codebase Context

> This document provides context for LLM assistants to understand the WriteTyper codebase without scanning files.

## Project Summary

**WriteTyper** is an Electron desktop application that generates plotter-ready SVG text from multiple font formats. It's designed for pen plotters, Cricut machines, laser cutters, and vector art workflows.

**Tech Stack:** Electron 28 + React 18 + Vite 5

**Repository:** `/Users/mgilbert/Code/writetyper`

## Directory Structure

```
writetyper/
├── package.json              # Main: "electron/main.cjs"
├── electron/
│   ├── main.cjs              # Electron main process (~1400 lines)
│   └── preload.cjs           # IPC bridge to renderer
├── src/
│   ├── App.jsx               # React UI (~900 lines)
│   ├── main.jsx              # React entry
│   └── index.css             # Styling
├── resources/
│   └── fonts/                # Bundled font files
│       ├── ems/              # 23 EMS SVG fonts
│       ├── relief/           # Relief SingleLine fonts
│       └── hershey-svg/      # Hershey SVG conversions
├── samples/                  # OCR test images
├── rust-cli.md               # Proposed Rust CLI implementation
├── NEXT_SESSION.md           # Development roadmap
└── llm-context/              # This directory - LLM context files
```

## Supported Font Formats

### 1. Hershey JHF (.jhf)
- Single-stroke vector fonts optimized for plotters
- ~15 fonts available (cursive, futural, scripts, romans, gothic, times)
- Auto-downloaded from: `https://github.com/kamalmostafa/hershey-fonts`
- Parser: `parseJHF()` in main.cjs

### 2. SVG Fonts (.svg)
- SVG files containing `<font>` elements with `<glyph>` children
- 43 embedded fonts (23 EMS + Relief SingleLine + Hershey conversions)
- Parser: `parseSVGFont()` in main.cjs

### 3. OpenType (.ttf, .otf)
- Standard system fonts via `opentype.js`
- Converts filled outlines to stroke paths
- Parser: Uses opentype.js library

## Key Features

1. **Text Rendering** - Convert text to SVG paths
2. **Font Selection** - Preview modal with all 47+ fonts
3. **Page Sizing** - Presets: 4x6, 5x8, 8x12, 9x12, 12x18, 12x24
4. **Page Margins** - Configurable top/right/bottom/left in inches
5. **Export** - SVG, PNG, JPG, JSON, clipboard
6. **OCR** - Extract text from images via Tesseract.js
7. **Glyph Templates** - Generate printable templates for handwriting capture

## Architecture Notes

- **Module System:** Electron uses CommonJS (.cjs), React uses ES modules
- **Font Processing:** All parsing in main process (not sandboxed renderer)
- **Stateless APIs:** All IPC handlers are pure functions
- **Page-Aware Output:** SVG uses 96 DPI, dimensions in inches
- **Coordinate Systems:** Each font type has different Y-axis conventions

## Configuration

- Default page size: 8x12 inches
- Default font size: 72pt
- Default stroke width: 2px
- DPI for output: 96

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server + Electron
npm run build        # Build for production
```
