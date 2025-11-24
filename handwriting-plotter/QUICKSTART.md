# Quick Start

## Start the App

```bash
cd handwriting-plotter
npm run dev
```

This single command will:
1. Start Vite dev server
2. Wait for it to be ready
3. Launch Electron app
4. Open DevTools automatically

## First Use

1. The app will open showing "Select a font and enter text to preview"
2. You need to add Hershey fonts first (see below) OR load a custom font

## Adding Hershey Fonts

Hershey fonts are referenced in the UI but not included. To add them:

1. Download Hershey fonts from: https://github.com/kamalmostafa/hershey-fonts
2. Create `resources/fonts/` directory if it doesn't exist
3. Copy `.svg` font files (e.g., `futural.svg`, `scripts.svg`) into that directory
4. Fonts will be available in the "Hershey" tab dropdown

OR use custom fonts:

1. Click "Custom Font" tab
2. Click "Load TTF/OTF Font"
3. Select any TrueType or OpenType font from your system

## Typical Workflow

1. Load a font (Hershey or custom)
2. Type your text
3. Adjust font size (24-200px)
4. Preview updates automatically
5. Export as SVG
6. Import SVG into Inkscape/Illustrator
7. Combine with other artwork
8. Use vpype or your plotter software to convert to G-code

## Export Options

- **Export SVG**: Save as .svg file for importing into artwork tools
- **Export as JSON**: Save path coordinates as JSON for programmatic use
- **Copy SVG**: Quick copy to clipboard for pasting

## Tips

- Auto-generate: Paths regenerate automatically 300ms after you stop typing
- Zoom: Use +/- buttons or scroll wheel to zoom preview
- Single-stroke fonts (Hershey) work best for plotters
- Regular fonts will have filled outlines, not single strokes

## Stopping the App

Press `Ctrl+C` in the terminal to stop both Vite and Electron.
