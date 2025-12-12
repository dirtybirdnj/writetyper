# electron/main.cjs - Core API Reference

> Key functions and IPC handlers in the Electron main process.

## File Overview

- **Path:** `electron/main.cjs`
- **Size:** ~1400 lines
- **Purpose:** Font parsing, path generation, SVG output, IPC handlers

## Font Parsing Functions

### parseJHF(content: string): object
**Lines:** 328-369

Parses Hershey JHF font format into glyph data.

```javascript
// Input: Raw JHF file content
// Output: { glyphs: { [charCode]: { paths, leftBearing, rightBearing } } }

// JHF format:
//   49 12MWOMOV RUMUV ROQUQ
//   ^^-- char code (ASCII)
//      ^^-- vertex count
//        ^^-- left/right bounds (chars relative to 'R')
//          ^^^^^^^^^^-- vertex data (' R' = pen up)
```

### parseHersheyCoords(coords: string): array
**Lines:** 371-406

Decodes JHF coordinate string into path arrays.

```javascript
// Input: "OMOV RUMUV ROQUQ"
// Output: [[{x, y}, {x, y}], [{x, y}, {x, y}, {x, y}]]
// Note: ' R' splits into separate paths (pen-up movements)
```

### parseSVGFont(content: string): object
**Lines:** 264-326

Parses SVG font files with `<font>` and `<glyph>` elements.

```javascript
// Input: SVG file content with <font> element
// Output: {
//   glyphs: { [unicode]: { d: "path data", horizAdvX: number } },
//   unitsPerEm: number,
//   ascent: number,
//   descent: number,
//   fontId: string
// }
```

## SVG Generation Functions

### generateHersheySVG(text, fontData, options): string
**Lines:** 1273-1349

Generates SVG from text using Hershey font data.

```javascript
// Options: { fontSize, charSpacing, strokeWidth, pageSize, pageRotated, pageMargins }
// Returns: Complete SVG string with <path> elements
```

### generateSVGFontSVG(text, fontData, options): string
**Lines:** 1199-1271

Generates SVG from text using SVG font data.

```javascript
// Handles Y-flip transformation (SVG fonts are Y-up)
// Returns: Complete SVG string
```

### generateSVG(text, fontData, options): string
**Lines:** 1351-1400+

Generates SVG from text using OpenType font data (via opentype.js).

```javascript
// Converts filled glyphs to stroke outlines
// Returns: Complete SVG string
```

### generateFontSamplesSVG(): string
**Lines:** 944-1012

Generates a multi-font samples document showing all fonts.

```javascript
// Creates 3-column layout with pangram samples
// Used for font preview/selection reference
```

## IPC Handlers

### font:load
**Line:** 559

```javascript
ipcMain.handle('font:load', async (event, fontPath) => {
  // Loads font file, detects type, parses accordingly
  // Returns: { type: 'hershey'|'svg'|'opentype', data: parsedFontData }
})
```

### paths:generate
**Line:** 624

```javascript
ipcMain.handle('paths:generate', async (event, args) => {
  // Args: { text, fontPath, fontSize, fontData, pageSize, charSpacing, strokeWidth, pageRotated, pageMargins }
  // Returns: { svg: string, paths: array, metadata: object }
})
```

### fonts:getAvailable
**Line:** 412

```javascript
ipcMain.handle('fonts:getAvailable', async () => {
  // Scans font directories, returns list of available fonts
  // Returns: [{ name, path, type }]
})
```

### export:svg
**Line:** 808

```javascript
ipcMain.handle('export:svg', async (event, svgData) => {
  // Opens save dialog, writes SVG to file
  // Returns: { success: boolean, path?: string }
})
```

### export:json
**Line:** 826

```javascript
ipcMain.handle('export:json', async (event, pathData) => {
  // Exports raw path coordinates as JSON
  // Returns: { success: boolean, path?: string }
})
```

### export:fontSamples
**Line:** 844

```javascript
ipcMain.handle('export:fontSamples', async () => {
  // Generates and saves font samples document
  // Returns: { success: boolean, path?: string }
})
```

## Constants

```javascript
const PAGE_SIZES = {
  '4x6': { width: 4, height: 6 },
  '5x8': { width: 5, height: 8 },
  '8x12': { width: 8, height: 12 },
  '9x12': { width: 9, height: 12 },
  '12x18': { width: 12, height: 18 },
  '12x24': { width: 12, height: 24 },
};

const DPI = 96;  // For SVG output dimensions
```

## Coordinate System Notes

1. **Hershey fonts:** Centered around origin, X spans ~-8 to +8
2. **SVG fonts:** Y-up coordinate system, requires flip for output
3. **OpenType:** Standard font metrics with ascent/descent from baseline
4. **Output SVG:** Y-down (standard SVG), dimensions in inches at 96 DPI
