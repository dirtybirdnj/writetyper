# Font Format Specifications

> Technical details for parsing the font formats supported by WriteTyper.

## 1. Hershey JHF Format

### Overview
Single-stroke vector fonts designed for plotters. Each glyph is defined as a series of connected line segments.

### File Structure
```
   49 12MWOMOV RUMUV ROQUQ
```

### Field Breakdown

| Position | Content | Description |
|----------|---------|-------------|
| 0-4 | `   49` | Character code (right-padded with spaces) |
| 5-7 | ` 12` | Vertex count (including bounds chars) |
| 8 | `M` | Left bearing: char code - 'R' (ASCII 82) |
| 9 | `W` | Right bearing: char code - 'R' |
| 10+ | `OMOV...` | Vertex data |

### Vertex Encoding
- Each vertex is 2 characters: X then Y
- Decode: `charCode - 'R'` gives signed offset from origin
- ` R` (space + R) = pen up, start new path segment

### Example Decoding
```
'O' = 79, 'R' = 82
X = 79 - 82 = -3
Y = next char - 82

' R' = pen lift (start new stroke)
```

### Coordinate System
- Origin at character center
- X typically spans -8 to +8
- Y typically spans -12 to +12
- Units are arbitrary (scale to font size)

### JavaScript Parser Reference
```javascript
function parseHersheyCoords(coords) {
  const paths = [];
  let currentPath = [];

  for (let i = 0; i < coords.length; i += 2) {
    if (coords[i] === ' ' && coords[i + 1] === 'R') {
      if (currentPath.length > 0) {
        paths.push(currentPath);
        currentPath = [];
      }
    } else {
      const x = coords.charCodeAt(i) - 82;     // 'R' = 82
      const y = coords.charCodeAt(i + 1) - 82;
      currentPath.push({ x, y });
    }
  }

  if (currentPath.length > 0) {
    paths.push(currentPath);
  }

  return paths;
}
```

---

## 2. SVG Font Format

### Overview
SVG 1.1 font format using `<font>` elements. Deprecated in SVG 2 but still widely supported.

### File Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="MyFont" horiz-adv-x="500">
      <font-face
        font-family="MyFont"
        units-per-em="1000"
        ascent="800"
        descent="-200"
        cap-height="700"
        x-height="500"
      />
      <missing-glyph horiz-adv-x="500" d="M0 0L500 0L500 700L0 700Z"/>
      <glyph unicode="A" horiz-adv-x="600" d="M0 0L300 700L600 0M100 300L500 300"/>
      <glyph unicode="B" horiz-adv-x="550" d="M50 0L50 700L300 700..."/>
      <!-- more glyphs -->
    </font>
  </defs>
</svg>
```

### Key Elements

#### `<font>`
```xml
<font id="FontName" horiz-adv-x="default-advance">
```
- `id` - Font identifier
- `horiz-adv-x` - Default horizontal advance (spacing to next char)

#### `<font-face>`
```xml
<font-face
  units-per-em="1000"
  ascent="800"
  descent="-200"
/>
```
- `units-per-em` - Design units per em-square (typically 1000 or 2048)
- `ascent` - Height above baseline
- `descent` - Depth below baseline (typically negative)

#### `<glyph>`
```xml
<glyph unicode="A" horiz-adv-x="600" d="M0 0L300 700L600 0"/>
```
- `unicode` - Character this glyph represents
- `horiz-adv-x` - Advance width (overrides font default)
- `d` - SVG path data

### Coordinate System
- **Y-axis is UP** (opposite of normal SVG)
- Origin at baseline left
- Must flip Y when converting to standard SVG output

### Path Data Commands
Standard SVG path commands:
- `M x y` - Move to
- `L x y` - Line to
- `H x` - Horizontal line
- `V y` - Vertical line
- `C x1 y1 x2 y2 x y` - Cubic bezier
- `Q x1 y1 x y` - Quadratic bezier
- `Z` - Close path

### JavaScript Parser Reference
```javascript
function parseSVGFont(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');

  const font = doc.querySelector('font');
  const fontFace = doc.querySelector('font-face');
  const glyphElements = doc.querySelectorAll('glyph');

  const glyphs = {};
  glyphElements.forEach(g => {
    const unicode = g.getAttribute('unicode');
    if (unicode && unicode.length === 1) {
      glyphs[unicode] = {
        d: g.getAttribute('d') || '',
        horizAdvX: parseFloat(g.getAttribute('horiz-adv-x')) || defaultAdvX
      };
    }
  });

  return {
    glyphs,
    unitsPerEm: parseFloat(fontFace?.getAttribute('units-per-em')) || 1000,
    ascent: parseFloat(fontFace?.getAttribute('ascent')) || 800,
    descent: parseFloat(fontFace?.getAttribute('descent')) || -200,
  };
}
```

---

## 3. OpenType/TrueType Format

### Overview
Standard font format (.ttf, .otf). Parsed using `opentype.js` library.

### Library Usage
```javascript
import opentype from 'opentype.js';

const font = await opentype.load(fontPath);

// Get glyph for character
const glyph = font.charToGlyph('A');

// Get path
const path = glyph.getPath(x, y, fontSize);

// Convert to SVG path data
const svgPath = path.toPathData();
```

### Key Properties
```javascript
font.unitsPerEm      // Design units (typically 1000 or 2048)
font.ascender        // Ascent in font units
font.descender       // Descent in font units (negative)

glyph.advanceWidth   // Horizontal advance
glyph.path           // Glyph outline
```

### Coordinate System
- Standard font coordinates (Y-up from baseline)
- opentype.js handles transformation to canvas/SVG coordinates

### Note on Stroke Conversion
OpenType fonts are **filled outlines**, not single strokes. WriteTyper uses them but the output is less optimal for plotters than true single-stroke fonts like Hershey or EMS.

---

## Format Comparison

| Aspect | Hershey JHF | SVG Font | OpenType |
|--------|-------------|----------|----------|
| Stroke type | Single-line | Single-line | Filled outline |
| Plotter optimal | Yes | Yes | No |
| File size | Tiny (~1KB) | Small (~50KB) | Medium (~50-500KB) |
| Character coverage | Limited ASCII | Varies | Full Unicode |
| Parsing complexity | Simple | Medium | Complex (use library) |
| Y-axis | Custom | Up | Up |
