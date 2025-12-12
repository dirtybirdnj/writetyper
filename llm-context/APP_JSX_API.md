# src/App.jsx - React UI Reference

> React component structure and state management.

## File Overview

- **Path:** `src/App.jsx`
- **Size:** ~900 lines
- **Purpose:** Main UI component with all controls and preview

## Component State

```javascript
const [text, setText] = useState('');
const [selectedFont, setSelectedFont] = useState(null);
const [fontData, setFontData] = useState(null);
const [fontSize, setFontSize] = useState(72);
const [charSpacing, setCharSpacing] = useState(1.0);
const [strokeWidth, setStrokeWidth] = useState(2);
const [pageSize, setPageSize] = useState('8x12');
const [pageRotated, setPageRotated] = useState(false);
const [pageMargins, setPageMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
const [svgOutput, setSvgOutput] = useState('');
const [pathData, setPathData] = useState(null);
const [availableFonts, setAvailableFonts] = useState([]);
const [showFontModal, setShowFontModal] = useState(false);
```

## Key UI Sections

### Header Controls
- Font selector button (opens modal)
- Font size input (1-999pt with decimals)
- Character spacing multiplier
- Stroke width

### Page Controls
- Page size dropdown
- Rotation toggle (portrait/landscape)
- Margin inputs (top, right, bottom, left in inches)

### Text Input
- Multiline textarea
- Updates preview on change

### Preview Area
- Live SVG preview
- Scaled to fit container

### Export Buttons
- SVG export
- PNG export
- JPG export
- Copy to clipboard

## IPC Bridge (window.electronAPI)

```javascript
// Font operations
window.electronAPI.getAvailableFonts()
window.electronAPI.loadFont(fontPath)
window.electronAPI.exportFontSamples()

// Rendering
window.electronAPI.generatePaths({
  text,
  fontPath,
  fontSize,
  fontData,
  pageSize,
  charSpacing,
  strokeWidth,
  pageRotated,
  pageMargins
})

// Export
window.electronAPI.exportSVG(svgData)
window.electronAPI.exportPNG(dataUrl)
window.electronAPI.exportJPG(dataUrl)
window.electronAPI.exportJSON(pathData)

// OCR
window.electronAPI.selectImage()
window.electronAPI.getSamples()
window.electronAPI.loadSample(samplePath)
```

## Font Modal

Displays all available fonts in a grid with preview samples.

```javascript
// Each font shows pangram preview
// Click to select font
// Font types indicated: Hershey, SVG, OpenType
```

## Effect Hooks

```javascript
// Load available fonts on mount
useEffect(() => {
  window.electronAPI.getAvailableFonts().then(setAvailableFonts);
}, []);

// Regenerate paths when any input changes
useEffect(() => {
  if (text && fontData) {
    window.electronAPI.generatePaths({...}).then(result => {
      setSvgOutput(result.svg);
      setPathData(result.paths);
    });
  }
}, [text, fontData, fontSize, charSpacing, strokeWidth, pageSize, pageRotated, pageMargins]);
```

## Menu Event Handlers

Registered via `window.electronAPI.onMenu*` callbacks:

- `onMenuUploadImage` - Trigger OCR image selection
- `onMenuLoadSample` - Load sample image for OCR
- `onMenuExportSVG/PNG/JPG` - Trigger exports
- `onMenuExportFontSamples` - Generate samples document
- `onMenuGlyphTemplate` - Generate glyph capture template
- `onMenuFontMenu` - Open font selection modal
