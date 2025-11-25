# Adding Custom Fonts to WriteTyper

WriteTyper supports custom single-line fonts for plotter and path applications. This guide shows you how to add your own handwriting fonts.

## Supported Font Formats

WriteTyper works with three font formats out of the box:

1. **SVG Fonts** (`.svg`) - Best for single-stroke paths
2. **Hershey Fonts** (`.jhf`) - Classic single-stroke format
3. **OpenType Fonts** (`.ttf`, `.otf`) - Standard filled fonts

For handwriting/plotter work, **SVG fonts are recommended** as they preserve single-stroke paths perfectly.

## Quick Start: Adding Your Font

### For SVG Fonts

1. **Prepare your font file**
   - Use existing tools like FontForge, Glyphr Studio, or online SVG font generators
   - Ensure your glyphs use single-stroke paths (no fills)
   - Export as SVG font format

2. **Add to WriteTyper**
   ```bash
   # Place your font file in the resources directory
   cp your-handwriting.svg resources/fonts/
   ```

3. **Restart WriteTyper** - Your font will appear in the font selector

### For Hershey Fonts

1. **Get or create a `.jhf` file**
   - Use existing Hershey fonts as templates
   - Or convert your paths using Hershey format tools

2. **Add to Hershey fonts directory**
   ```bash
   cp your-font.jhf ~/writetyper/hershey-fonts/hershey-fonts/
   ```

3. **Restart WriteTyper** - Your font will appear in the Hershey fonts section

## SVG Font Format Reference

Here's the minimal structure WriteTyper expects:

```xml
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
<defs>
<font id="YourFont" horiz-adv-x="500">
  <font-face
    font-family="Your Handwriting"
    units-per-em="1000"
    ascent="800"
    descent="-200"
  />

  <!-- Define glyphs with single-stroke paths -->
  <glyph glyph-name="A" unicode="A" horiz-adv-x="676"
    d="M155 213h367M606 0l-264 675h-4l-268 -675" />

  <glyph glyph-name="B" unicode="B" horiz-adv-x="634"
    d="M140 10h162c173 0 232 75..." />

  <!-- Add more glyphs... -->
</font>
</defs>
</svg>
```

### Key Parameters

- **units-per-em**: Coordinate system scale (usually 1000)
- **ascent**: Height above baseline (usually 800)
- **descent**: Depth below baseline (usually -200)
- **horiz-adv-x**: Character width (advance width)
- **unicode**: The character this glyph represents
- **d**: SVG path data (your handwriting strokes)

## Tools for Creating SVG Fonts

External tools you can use (not part of WriteTyper):

- **FontForge**: Free, powerful font editor
- **Glyphr Studio**: Web-based font editor
- **IcoMoon**: Online SVG font generator
- **FontForge scripts**: Automate conversion from SVG paths

## Tips for Plotter-Friendly Fonts

1. **Use single strokes**: No filled shapes, only path outlines
2. **Minimize pen-up moves**: Connect strokes where possible
3. **Consistent stroke width**: Let your plotter control line width
4. **Test at target size**: Preview at the size you'll plot
5. **Check spacing**: Ensure `horiz-adv-x` values look good

## Directory Structure

```
writetyper/
├── resources/
│   └── fonts/
│       ├── relief/              # Built-in Relief fonts
│       │   └── *.svg
│       └── custom/              # Your custom fonts (create this)
│           └── your-font.svg
└── ~/writetyper/
    └── hershey-fonts/           # Hershey fonts
        └── hershey-fonts/
            └── *.jhf
```

## Need Help?

- Check existing fonts in `resources/fonts/relief/` for examples
- Look at Relief SingleLine SVG font structure for reference
- The app auto-detects fonts in the resources directory

## Keeping Scope Tight

WriteTyper focuses on **using** single-line fonts for plotter output, not creating them. Use external tools to create your font files, then simply drop them into WriteTyper to use them for generating plotter-ready text.
