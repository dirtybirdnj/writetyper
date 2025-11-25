# Existing Handwriting & Font-to-Plotter Tools

A comprehensive inventory of open source and commercial solutions for generating handwriting paths and single-stroke fonts suitable for pen plotters. This document catalogs all discovered options regardless of platform, licensing, or maturity level for evaluation and potential integration into the handwriting plotter workflow.

## Table of Contents

1. [Handwriting Generation (AI/RNN-Based)](#handwriting-generation-airnn-based)
2. [Font Processing & Glyph Extraction](#font-processing--glyph-extraction)
3. [Single-Line/Stroke Font Systems](#single-linestroke-font-systems)
4. [Path Optimization & Plotter Preparation](#path-optimization--plotter-preparation)
5. [Font Creation & Editing Tools](#font-creation--editing-tools)
6. [SVG Font Rendering](#svg-font-rendering)
7. [Integration Strategies](#integration-strategies)

---

## Handwriting Generation (AI/RNN-Based)

### 1. **handwriting-synthesis** (Multiple Implementations)

**Repository:** https://github.com/sjvasquez/handwriting-synthesis

**Language:** Python (TensorFlow)

**Status:** ✅ Open Source (MIT)

**What it does:**
- Generates realistic handwriting using RNNs based on Alex Graves' paper "Generating Sequences with Recurrent Neural Networks"
- Produces SVG output directly
- Supports multiple writing styles with configurable bias (legibility control)

**Features:**
- Text input → handwriting SVG paths
- Style selection (0-9 different styles)
- Bias control for handwriting clarity
- Stroke-based output (pen up/down markers)
- Varying handwriting per input (not repetitive)

**Output Format:** SVG with stroke paths

**Setup:** 
```bash
git clone https://github.com/sjvasquez/handwriting-synthesis
cd handwriting-synthesis
pip install -r requirements.txt
python demo.py
```

**Pros:**
- Realistic human-like handwriting variation
- Direct SVG output for plotters
- Pre-trained models available
- MIT license

**Cons:**
- TensorFlow dependency (slower setup)
- Requires Python runtime at generation time
- Models are somewhat dated (2016 implementation)
- Not optimized for batch processing

**Integration Path:** Python subprocess from Node.js, cache outputs

**Related Implementations:**
- https://github.com/swechhasingh/Handwriting-synthesis (TensorFlow)
- https://github.com/snowkylin/rnn-handwriting-generation (TensorFlow)
- https://github.com/Grzego/handwriting-generation (TensorFlow with style selection)
- https://github.com/CT83/handwriting-synthesis (Packaged for usability)

**Academic Reference:** https://arxiv.org/abs/1308.0850

---

### 2. **Scribe: Generating Realistic Handwriting with TensorFlow**

**Repository:** https://greydanus.github.io/2016/08/21/handwriting/

**Language:** Python (TensorFlow)

**Status:** ✅ Open Source (Tutorial + Code)

**What it does:**
- Educational implementation of Graves' handwriting synthesis
- Explains MDN (Mixture Density Networks) and attention mechanisms
- Good tutorial for understanding the underlying architecture

**Features:**
- Step-by-step implementation guide
- Mixture density network for uncertainty modeling
- Attention mechanism for text conditioning

**Output Format:** Generated point sequences (convertible to SVG)

**Pros:**
- Excellent learning resource
- Clear explanation of model architecture
- Good for understanding how handwriting generation works

**Cons:**
- More educational than production-ready
- Requires significant setup
- Not optimized for real-time use

**Integration Path:** As reference implementation for building custom version

---

## Font Processing & Glyph Extraction

### 3. **opentype.js**

**Repository:** https://github.com/opentypejs/opentype.js

**Language:** JavaScript (Node.js + Browser)

**Status:** ✅ Open Source (MIT)

**What it does:**
- Pure JavaScript parser/writer for TrueType and OpenType fonts
- Extracts glyph outlines as Bézier paths
- Converts paths to SVG format
- Works in Node.js and browsers

**Features:**
- Load TTF/OTF fonts without native dependencies
- Extract individual glyph paths
- Convert glyphs to SVG
- Support for font metrics (ascender, descender, etc.)
- Kerning support
- Ligature support

**Output Format:** SVG paths, glyph commands, or JSON coordinates

**Setup:**
```bash
npm install opentype.js
```

**Pros:**
- Pure JavaScript (no native compilation needed)
- Works in Node.js and Electron
- Fast and lightweight
- Excellent for Electron integration
- Well-maintained
- No external dependencies

**Cons:**
- Limited to outline fonts (traditional TTF/OTF)
- Doesn't handle all OpenType variations
- Not suitable for single-stroke fonts directly

**Integration Path:** ✅ **PRIMARY RECOMMENDATION** - Already implemented in boilerplate

**Example Usage:**
```javascript
const opentype = require('opentype.js');
const font = opentype.loadSync('font.ttf');
const path = font.getPath('A', 0, 0, 72);
const svgPath = path.toSVG();
```

---

### 4. **fontTools (Python)**

**Repository:** https://github.com/fonttools/fonttools

**Language:** Python

**Status:** ✅ Open Source (MIT)

**What it does:**
- Comprehensive font manipulation library
- Font parsing, metrics extraction, table manipulation
- TTX (XML intermediate format) support
- Advanced font features (variations, hinting)

**Features:**
- Complete TrueType/OpenType support
- Pen protocol for custom rendering
- Font subsetting
- Variable font support
- Hinting support

**Output Format:** Glyph outlines, SVG, or custom via Pen protocol

**Setup:**
```bash
pip install fonttools --break-system-packages
```

**Pros:**
- Most comprehensive font library available
- Supports advanced font features
- Excellent for batch processing
- Industry-standard tool

**Cons:**
- Python-only (need subprocess from Node.js)
- Steeper learning curve
- Overkill for simple glyph extraction

**Integration Path:** Python subprocess from Node.js main process

---

### 5. **fontkit (Node.js)**

**Repository:** https://github.com/foliojs/fontkit

**Language:** JavaScript (Node.js + Browser)

**Status:** ✅ Open Source (MIT)

**What it does:**
- Advanced font engine for Node.js and browser
- More feature-complete than opentype.js
- Used by PDFKit
- Glyph path extraction and SVG conversion

**Features:**
- TrueType (glyf) and PostScript (CFF) support
- WOFF/WOFF2 support
- Advanced glyph substitution (GSUB/GPOS)
- AAT features
- Color glyphs (emoji support)
- Variable font support
- Font subsetting

**Output Format:** SVG paths, glyph commands

**Setup:**
```bash
npm install fontkit
```

**Pros:**
- More comprehensive than opentype.js
- Supports more font formats (WOFF2, etc.)
- Better PostScript handling
- SVG path generation built-in

**Cons:**
- Slightly larger bundle size
- Can be overkill for simple fonts
- Less documentation than opentype.js

**Integration Path:** Alternative to opentype.js for advanced use cases

**Example Usage:**
```javascript
const fontkit = require('fontkit');
const font = fontkit.openSync('font.ttf');
const run = font.layout('Hello');
const svgPath = run.glyphs[0].path.toSVG();
```

---

## Single-Line/Stroke Font Systems

### 6. **Hershey Text (Inkscape Extension)**

**Repository:** https://github.com/evil-mad/svg-fonts (Evil Mad Scientist)

**Language:** Python (Inkscape plugin)

**Status:** ✅ Open Source (GPL-compatible)

**What it does:**
- Inkscape extension for rendering text with single-line fonts
- Converts text to single-stroke paths suitable for plotters
- Works with SVG font format (.svg)

**Features:**
- Built-in Hershey fonts (classic single-stroke fonts)
- Renders text as continuous paths (pen doesn't lift)
- Multiple style presets
- Compatible with pen plotter workflows
- Now built-in to Inkscape 1.0+

**Output Format:** SVG with single-line paths

**Fonts Included:** futural, futura, gothic-english, gothic-german, gothic-italian, script, simplex, triplex

**Pros:**
- Zero setup for basic use (built into Inkscape)
- Ideal for rapid prototyping
- Proven in plotter community
- SVG fonts are portable and editable

**Cons:**
- Desktop-only (Inkscape GUI)
- Can't easily batch-process programmatically
- Hershey fonts look dated

**Integration Path:** 
- Load SVG fonts programmatically
- Parse SVG font format directly
- Render using extracted glyphs

**Font Location:** https://github.com/evil-mad/HersheyFonts

---

### 7. **Custom Stroke Font Extension (Inkscape)**

**Repository:** https://github.com/Shriinivas/inkscapestrokefont

**Language:** Python (Inkscape plugin)

**Status:** ✅ Open Source (GPL)

**What it does:**
- Inkscape extension for creating custom single-stroke fonts
- Allows designing your own stroke fonts from scratch
- Generates SVG font format
- Includes rendering support

**Features:**
- Design custom glyphs as single paths
- Create SVG font files
- Render text with custom fonts
- Edit existing stroke fonts
- Support for extended character sets

**Output Format:** SVG fonts (.svg) - compatible with Hershey Text

**Pros:**
- Create custom handwriting fonts
- Full control over stroke design
- Integrates with Inkscape workflow

**Cons:**
- Manual glyph design required
- Desktop-only tool
- Time-consuming for full character sets

**Integration Path:** Create fonts with this, then load with SVG font parser

---

### 8. **single-line-font-renderer (Web-Based)**

**Repository:** https://github.com/jvolker/single-line-font-renderer

**Language:** JavaScript (Web app)

**Status:** ✅ Open Source

**What it does:**
- Browser-based tool for rendering single-line fonts
- Converts text to SVG paths
- Uses opentype.js under the hood
- Supports SVG fonts and some TTF variants

**Features:**
- Drag-and-drop font loading
- Real-time preview
- SVG and DXF export
- Works with Evil Mad Scientist font repository
- Responsive design

**Output Format:** SVG paths, DXF (CNC format)

**Fonts Source:** https://github.com/evil-mad/svg-fonts

**Pros:**
- No installation needed
- Visual preview before export
- Good for testing fonts
- DXF export for CAM software

**Cons:**
- Web-based (requires internet for live demo)
- Limited programmatic access
- Not suitable for automation

**Integration Path:** Inspiration for UI/UX, port logic to Node.js

---

### 9. **Relief SingleLine Font (GitHub)**

**Repository:** https://github.com/isdat-type/Relief-SingleLine

**Language:** Font files (OTF/SVG)

**Status:** ✅ Open Source (OFL License)

**What it does:**
- High-quality single-line typeface specifically designed for plotters/fab labs
- Available in OTF and SVG formats
- Professional typography for CNC machines

**Features:**
- Multiple weights
- Kerning support
- Extended character set
- Designed for modern CAD/laser cutting
- Better quality than Hershey fonts

**Output Format:** OTF (outline font that looks like single-line), SVG (true single-line)

**Usage:**
- Import OTF into Inkscape/Illustrator
- Use "Hershey Text" extension to render
- Or load SVG font directly with parser

**Pros:**
- Modern design (not dated like Hershey)
- Professional quality
- Open source (OFL)
- Works with existing tools

**Cons:**
- Manual download required
- Limited character set compared to standard fonts

**Integration Path:** Bundle with app as default font library

---

## Path Optimization & Plotter Preparation

### 10. **vpype (Python)**

**Repository:** https://github.com/abey79/vpype

**Language:** Python (CLI + Library)

**Status:** ✅ Open Source (MIT)

**What it does:**
- Swiss-army knife for plotter vector graphics
- Optimizes SVG for plotting performance
- Line merging, sorting, simplification
- Multi-layer support with per-layer operations

**Features:**
- **linemerge**: Connect nearby line endpoints (reduce pen lifts)
- **linesort**: Minimize pen-up travel distance
- **linesimplify**: Reduce unnecessary points while maintaining precision
- **linesplit**: Split complex paths
- **crop**: Remove out-of-bounds geometry
- Layout and scaling tools
- Hardware-accelerated viewer
- Extensible via plugins

**Output Format:** Optimized SVG

**Setup:**
```bash
pip install vpype --break-system-packages
```

**Command Example:**
```bash
vpype read input.svg linemerge -t 0.05mm linesort linesimplify -t 0.1mm write output.svg
```

**Pros:**
- Dramatically improves plot quality
- Reduces plotting time
- Industry-standard tool
- Active development
- Well-documented

**Cons:**
- Python dependency
- Need subprocess integration
- Learning curve for all options
- Optional for basic workflows

**Integration Path:** ✅ Already stubbed in boilerplate - call as subprocess

**Use Cases:**
- Merging broken paths
- Minimizing pen travel
- Removing micro-segments that slow plotters
- Preparing final output

---

### 11. **Potrace (Path Tracing)**

**Repository:** http://potrace.sourceforge.net/

**Language:** C (CLI + Libraries)

**Status:** ✅ Open Source (GPL)

**What it does:**
- Converts raster images to vector paths
- Useful for tracing scanned handwriting

**Features:**
- High-quality vectorization
- Multiple output formats (SVG, PDF, PostScript)
- Tunable parameters for quality/detail

**Usage for Handwriting:**
```bash
potrace -s input.bmp -o output.svg  # Scan → SVG
```

**Pros:**
- Standard tool for image tracing
- High quality output
- Scriptable

**Cons:**
- Raster-only input (need scanned handwriting)
- Not for digital fonts
- Slower than direct font approaches

**Integration Path:** Optional for scanned handwriting workflows

---

## Font Creation & Editing Tools

### 12. **FontForge**

**Repository:** https://github.com/fontforge/fontforge

**Language:** C with Python scripting

**Status:** ✅ Open Source (GPL/LGPL)

**What it does:**
- Full-featured font editor
- Create, edit, and compile fonts
- Convert between font formats
- Python scripting for automation

**Features:**
- Visual glyph editor
- TrueType and PostScript support
- SVG font support
- Font validation
- Kerning editor
- Python-Fu scripting

**Pros:**
- Most powerful open source font tool
- Supports all modern font formats
- Scriptable

**Cons:**
- Steep learning curve
- Desktop UI can be unintuitive
- Overkill for simple workflows
- Slower startup

**Integration Path:**
- Create fonts via CLI:
```bash
fontforge -script generate.py
```
- Python-Fu scripting for batch operations

**Example:** Create stroke fonts from SVG glyphs

---

### 13. **Inkscape (Font Editor)**

**Repository:** https://inkscape.org/

**Language:** C++

**Status:** ✅ Open Source (GPL)

**What it does:**
- Vector graphics editor with built-in font tools
- SVG font editor (Text → SVG Font Editor)
- Can create and edit single-line fonts
- Excellent for creating glyph libraries

**Features:**
- Visual glyph design
- Single-line path support (ideal for plotters)
- SVG export
- Integration with FontForge
- Extensions for font creation

**Workflow:**
1. Design glyphs as paths in Inkscape
2. Use SVG Font Editor to organize into font
3. Export as SVG font
4. Load with font parser

**Pros:**
- Easy visual design
- Perfect for single-stroke fonts
- SVG-native (plotter-friendly)
- No learning curve for designers

**Cons:**
- Manual work for full character sets
- Desktop tool (not scriptable for automation)

**Integration Path:** 
- Suggest to users for font creation
- Load resulting SVG fonts programmatically

---

## SVG Font Rendering

### 14. **SVG Font Format Parser**

**What it does:**
- Parse SVG font files (.svg extension)
- Extract glyph path data
- Render text using SVG glyphs

**Implementation Requirements:**
```javascript
// Parse SVG font XML
const glyphRegex = /<glyph[^>]*unicode="([^"]*)"[^>]*d="([^"]*)"/g

// Extract character → path mapping
const glyphs = new Map()
let match
while ((match = glyphRegex.exec(svgContent)) !== null) {
  glyphs.set(match[1], match[2])  // char → SVG path data
}

// Render text
for (const char of text) {
  const pathData = glyphs.get(char)
  // Scale and position path data
}
```

**Pros:**
- Format is simple XML
- Glyphs are standard SVG paths
- Easy to parse and manipulate
- Human-readable for debugging

**Cons:**
- Spacing/metrics extraction is manual
- Need to implement kerning yourself
- No standard for all font properties

**Integration Path:** ✅ Already implemented in boilerplate

**Standards:**
- W3C SVG Font Specification: https://www.w3.org/TR/SVG/fonts.html
- Note: SVG fonts are deprecated in browsers but still valid for tools

---

## Integration Strategies

### Strategy 1: Hershey-First (Recommended for MVP)

**Best for:** Rapid prototyping, user testing

```
User Input → SVG Font Parser → SVG Paths → Preview → Export
                 ↑
            Pre-bundled Hershey fonts
```

**Advantages:**
- ✅ Zero dependencies
- ✅ Instant rendering
- ✅ No AI/ML runtime needed
- ✅ Perfect for immediate feedback

**Limitations:**
- Dated visual style
- Limited font variety

**Boilerplate Status:** ✅ Already implemented

---

### Strategy 2: Custom OpenType Fonts

**Best for:** Professional workflows, custom fonts

```
User selects TTF/OTF → opentype.js parses → Glyph extraction 
                        → Bezier curves → SVG → Preview → Export
```

**Advantages:**
- ✅ Any font can be used
- ✅ Professional typography
- ✅ No external dependencies
- ✅ Fast processing

**Limitations:**
- Outline fonts (not single-stroke by default)
- Need metrics calculation

**Boilerplate Status:** ✅ Already implemented

---

### Strategy 3: Single-Stroke Custom Fonts

**Best for:** Maximum control, custom handwriting

```
Designer creates in Inkscape → SVG Font → App parser 
→ Extract glyphs → SVG paths → Preview → Export
```

**Workflow:**
1. User creates font using Inkscape + Custom Stroke Font extension
2. Export as SVG font
3. Load in app
4. Parse and render

**Advantages:**
- ✅ True single-stroke (optimal for plotters)
- ✅ Complete control over design
- ✅ Professional results

**Limitations:**
- ⏱️ Time-intensive (must design each glyph)
- 🎨 Requires design skills

**Integration:** SVG font parser (already in boilerplate)

---

### Strategy 4: RNN Handwriting Generation (Future)

**Best for:** Variety, human-like output, batch processing

```
Text + Style → TensorFlow RNN → Stroke sequences 
→ SVG conversion → Preview → Export
```

**Setup:**
1. Use handwriting-synthesis repo
2. Run as Python subprocess
3. Stream SVG results back

**Advantages:**
- ✅ Realistic variation
- ✅ Multiple styles
- ✅ Research-backed quality

**Limitations:**
- ⏱️ Setup complexity
- 🔄 Slower than direct rendering
- 💾 Model files needed

**Integration Path:**
```javascript
// From Node.js main process
import { spawn } from 'child_process'

const python = spawn('python', ['generate.py', '--text', text])
python.stdout.on('data', (svgData) => {
  // SVG from handwriting-synthesis
})
```

**Boilerplate Status:** Stubbed, can be implemented in Phase 2

---

### Strategy 5: Path Optimization Pipeline

**Best for:** Production plotter output

```
Any SVG → vpype (linemerge, linesort, linesimplify) → Optimized SVG
```

**Tools:**
- vpype for optimization
- Fallback to basic optimization if vpype not installed

**Advantages:**
- ✅ Better plot quality
- ✅ Reduced plotting time
- ✅ Professional results

**Limitations:**
- Optional (basic output still works)
- Python dependency

**Boilerplate Status:** ✅ Already integrated as subprocess

---

## Recommended Implementation Order

### Phase 1 (MVP - Current Boilerplate)
- ✅ Hershey fonts (SVG font parser)
- ✅ OpenType fonts (opentype.js)
- ✅ Basic path optimization fallback
- ✅ SVG export

**Time to Functional:** 1-2 hours (just install and run)

### Phase 2 (Enhanced)
- 🔄 vpype integration (subprocess)
- 🔄 SVG font custom font support
- 🔄 Better metrics/kerning handling
- 🔄 UI improvements

**Time to Implement:** 2-3 hours

### Phase 3 (Advanced)
- 🔄 RNN handwriting synthesis
- 🔄 Font creation workflow (Inkscape guide)
- 🔄 Batch processing
- 🔄 Plotter integration (serial communication)

**Time to Implement:** 4-6 hours

### Phase 4+ (Polish)
- Variable fonts support
- More exotic formats (WOFF2, COLOR)
- Custom model training
- Advanced AI features

---

## Evaluation Matrix

| Tool | License | Language | Setup Time | Quality | Ease of Use | Integration |
|------|---------|----------|-----------|---------|-------------|-------------|
| Hershey Fonts | GPL | SVG | 5 min | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Direct |
| opentype.js | MIT | JavaScript | 2 min | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ npm |
| fontkit | MIT | JavaScript | 2 min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ npm |
| fontTools | MIT | Python | 5 min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 🟡 subprocess |
| SVG Fonts | W3C Spec | Format | 10 min | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Parser |
| vpype | MIT | Python | 5 min | ⭐⭐⭐⭐⭐ | ⭐⭐ | 🟡 subprocess |
| Relief SingleLine | OFL | Font | 2 min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Bundle |
| handwriting-synthesis | MIT | Python | 15 min | ⭐⭐⭐⭐ | ⭐⭐ | 🟡 subprocess |
| Inkscape | GPL | C++ | 10 min | ⭐⭐⭐⭐ | ⭐⭐⭐ | 🟡 Manual |
| FontForge | GPL | C | 15 min | ⭐⭐⭐⭐⭐ | ⭐⭐ | 🟡 Scripting |

---

## Quick Reference: What to Use When

**"I want something working in 5 minutes"**
→ Use bundled Hershey fonts (in boilerplate)

**"I want to use my own fonts"**
→ Use opentype.js (load TTF/OTF files)

**"I want single-stroke custom fonts"**
→ Design in Inkscape + Custom Stroke Font extension → Load SVG font

**"I want realistic handwriting variation"**
→ Set up handwriting-synthesis (Phase 2+)

**"I want optimal plotter output"**
→ Enable vpype optimization (subprocess call)

**"I want professional quality"**
→ Use Relief SingleLine font + opentype.js + vpype

**"I want maximum control"**
→ FontForge for font creation + opentype.js for rendering

---

## Resources & Links

### Repositories
- Hershey Fonts: https://github.com/evil-mad/HersheyFonts
- handwriting-synthesis: https://github.com/sjvasquez/handwriting-synthesis
- opentype.js: https://github.com/opentypejs/opentype.js
- fontkit: https://github.com/foliojs/fontkit
- fontTools: https://github.com/fonttools/fonttools
- vpype: https://github.com/abey79/vpype
- Relief SingleLine: https://github.com/isdat-type/Relief-SingleLine
- single-line-font-renderer: https://github.com/jvolker/single-line-font-renderer

### Documentation
- opentype.js: https://opentype.js.org/
- fontTools: https://fonttools.readthedocs.io/
- vpype: https://vpype.readthedocs.io/
- Inkscape Font Editor: https://inkscape.org/
- FontForge: https://fontforge.org/

### Academic Papers
- Graves, A. (2013). Generating Sequences With Recurrent Neural Networks: https://arxiv.org/abs/1308.0850

### Standards
- SVG Fonts: https://www.w3.org/TR/SVG/fonts.html
- OpenType Specification: https://docs.microsoft.com/en-us/typography/opentype/spec/

---

## Next Steps for Evaluation

1. **Test each modality** in the provided Electron boilerplate
2. **Compare output quality** side-by-side
3. **Benchmark performance** for your specific use case
4. **Evaluate user workflows** - which is easiest for users?
5. **Consider hybrid approach** - combine multiple methods

**Priority:** Start with Hershey + OpenType (already implemented), then layer in others as needed.