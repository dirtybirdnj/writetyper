const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const os = require('os');

let mainWindow;
let sampleFiles = []; // Cache for sample files
const WRITETYPER_DIR = path.join(os.homedir(), 'writetyper');
const FONTS_DIR = path.join(WRITETYPER_DIR, 'hershey-fonts');

// Setup WriteTyper directory and download Hershey fonts on first run
async function setupHersheyFonts() {
  try {
    // Create writetyper directory if it doesn't exist
    if (!fs.existsSync(WRITETYPER_DIR)) {
      fs.mkdirSync(WRITETYPER_DIR, { recursive: true });
      console.log('Created WriteTyper directory:', WRITETYPER_DIR);
    }

    // Check if fonts already downloaded
    if (fs.existsSync(FONTS_DIR) && fs.existsSync(path.join(FONTS_DIR, 'hershey-fonts'))) {
      console.log('Hershey fonts already downloaded');
      return;
    }

    console.log('First run detected - downloading Hershey fonts...');

    // Clone the repository
    return new Promise((resolve, reject) => {
      const cloneCmd = `git clone https://github.com/kamalmostafa/hershey-fonts.git "${FONTS_DIR}"`;

      exec(cloneCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to download Hershey fonts:', error);
          reject(error);
          return;
        }

        console.log('Hershey fonts downloaded successfully to:', FONTS_DIR);
        resolve();
      });
    });
  } catch (error) {
    console.error('Error setting up Hershey fonts:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Development mode: load from Vite dev server
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Load sample files for menu
function loadSampleFiles() {
  try {
    const samplesDir = path.join(__dirname, '../samples');
    if (!fs.existsSync(samplesDir)) {
      return [];
    }

    const files = fs.readdirSync(samplesDir);
    const imageFiles = files.filter(f =>
      /\.(png|jpg|jpeg|gif|bmp|webp|tiff)$/i.test(f)
    );

    return imageFiles.map(f => ({
      name: f,
      path: path.join(samplesDir, f)
    }));
  } catch (error) {
    console.error('Error loading sample files:', error);
    return [];
  }
}

// Build application menu
function buildMenu() {
  sampleFiles = loadSampleFiles();

  const isMac = process.platform === 'darwin';

  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Export SVG',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:export-svg')
        },
        {
          label: 'Export PNG',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow?.webContents.send('menu:export-png')
        },
        {
          label: 'Export JPG',
          accelerator: 'CmdOrCtrl+Shift+J',
          click: () => mainWindow?.webContents.send('menu:export-jpg')
        },
        { type: 'separator' },
        {
          label: 'Export Font Samples',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => mainWindow?.webContents.send('menu:export-font-samples')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    // Tools menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Upload Image (OCR)',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:upload-image')
        },
        {
          label: 'Load Samples',
          submenu: sampleFiles.length > 0 ? sampleFiles.map(sample => ({
            label: sample.name,
            click: () => mainWindow?.webContents.send('menu:load-sample', sample.path)
          })) : [{ label: 'No samples available', enabled: false }]
        },
        { type: 'separator' },
        {
          label: 'Glyph Template Generator',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow?.webContents.send('menu:glyph-template')
        },
        { type: 'separator' },
        {
          label: 'Font Menu',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('menu:font-menu')
        }
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  await setupHersheyFonts();
  buildMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Page Size Parser
function parsePageSize(pageSizeStr, rotated = false) {
  let [width, height] = pageSizeStr.split('x').map(Number);

  // Swap dimensions if rotated
  if (rotated) {
    [width, height] = [height, width];
  }

  const DPI = 96; // Standard web DPI
  return {
    width,
    height,
    widthPx: width * DPI,
    heightPx: height * DPI
  };
}

// SVG Font Parser
function parseSVGFont(content) {
  const glyphs = {};

  // Extract font metrics
  const fontFaceMatch = content.match(/<font-face[^>]*units-per-em="(\d+)"[^>]*ascent="([^"]*)"[^>]*descent="([^"]*)"[^>]*>/);
  const unitsPerEm = fontFaceMatch ? parseInt(fontFaceMatch[1]) : 1000;
  const ascent = fontFaceMatch ? parseFloat(fontFaceMatch[2]) : 800;
  const descent = fontFaceMatch ? parseFloat(fontFaceMatch[3]) : -200;

  // Extract horiz-adv-x default (character width)
  const fontDefaultWidth = content.match(/<font[^>]*horiz-adv-x="(\d+)"/);
  const defaultWidth = fontDefaultWidth ? parseInt(fontDefaultWidth[1]) : 500;

  // Parse all glyph elements - extract unicode, horiz-adv-x, and path data
  // Use separate regex patterns for more reliable parsing
  const glyphRegex = /<glyph[^>]*>/g;
  let glyphMatch;

  while ((glyphMatch = glyphRegex.exec(content)) !== null) {
    const glyphTag = glyphMatch[0];

    // Extract unicode
    const unicodeMatch = glyphTag.match(/unicode="([^"]*)"/);
    if (!unicodeMatch) continue;
    let unicode = unicodeMatch[1];

    // Extract horiz-adv-x (optional, supports decimals)
    const advMatch = glyphTag.match(/horiz-adv-x="([\d.]+)"/);
    const horizAdvX = advMatch ? parseFloat(advMatch[1]) : defaultWidth;

    // Extract path data
    const pathMatch = glyphTag.match(/\sd="([^"]*)"/);
    const pathData = pathMatch ? pathMatch[1] : '';

    // Handle HTML entities like &#xc1; (Á)
    if (unicode.startsWith('&#x')) {
      const hex = unicode.slice(3, -1);
      unicode = String.fromCharCode(parseInt(hex, 16));
    } else if (unicode.startsWith('&#')) {
      const decimal = unicode.slice(2, -1);
      unicode = String.fromCharCode(parseInt(decimal, 10));
    }

    if (pathData && pathData.trim()) {
      const charCode = unicode.charCodeAt(0);
      glyphs[charCode] = {
        pathData: pathData,
        advanceWidth: horizAdvX
      };
    }
  }

  console.log(`Parsed SVG font: ${Object.keys(glyphs).length} glyphs, unitsPerEm=${unitsPerEm}`);

  return {
    glyphs,
    unitsPerEm,
    ascent,
    descent,
    defaultWidth
  };
}

// Hershey JHF Parser
function parseJHF(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const glyphs = {};

  lines.forEach((line, index) => {
    const match = line.match(/^\s*\d+\s+(\d+)(.+)$/);
    if (!match) return;

    const strokeCount = parseInt(match[1]);
    const data = match[2];

    // JHF format: glyphs are indexed by line number (starting at 1)
    // Line 1 = glyph 1 (space, ASCII 32)
    // Line 33 = glyph 33 (A, ASCII 65)
    const glyphIndex = index + 1;

    // Convert glyph index to ASCII character code
    // Most Hershey fonts start at ASCII 32 (space) as glyph 1
    const charCode = glyphIndex + 31; // glyph 1 -> ASCII 32

    // First two chars after stroke count are left/right bounds
    const leftRight = data.substring(0, 2);
    const coords = data.substring(2);

    // Debug 'H' character specifically
    if (charCode === 72) {  // 'H'
      console.log(`=== CHAR 'H' (${charCode}) ===`);
      console.log(`Raw line: ${line}`);
      console.log(`leftRight: "${leftRight}"`);
      console.log(`coords: "${coords.substring(0, 50)}"`);
    }

    // Parse Hershey coordinate pairs
    const pathData = parseHersheyCoords(coords);

    if (pathData) {
      glyphs[charCode] = pathData;
    }
  });

  return glyphs;
}

function parseHersheyCoords(coords) {
  if (!coords || coords.length < 2) return null;

  const commands = [];
  let penUp = true;

  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 >= coords.length) break;

    const char1 = coords[i];
    const char2 = coords[i + 1];

    // ' R' means pen up (move to next stroke)
    if (char1 === ' ' && char2 === 'R') {
      penUp = true;
      i += 0; // Will increment by 2 in loop
      continue;
    }

    // 'R ' at start of coords means start of strokes
    if (char1 === 'R' && char2 === ' ') {
      i += 0;
      continue;
    }

    const x = char1.charCodeAt(0) - 82;  // 'R' is origin (ASCII 82)
    const y = char2.charCodeAt(0) - 82;

    if (penUp) {
      commands.push(`M ${x} ${y}`);
      penUp = false;
    } else {
      commands.push(`L ${x} ${y}`);
    }
  }

  const result = commands.join(' ');
  return result;
}

// IPC Handlers
ipcMain.handle('fonts:getAvailable', async () => {
  try {
    const fonts = [];
    const hersheyDir = path.join(FONTS_DIR, 'hershey-fonts');

    // English/ASCII compatible fonts only
    const englishFonts = [
      'cursive', 'futural', 'futuram', 'scripts', 'scriptc',
      'rowmans', 'rowmant', 'rowmand',
      'gothgbt', 'gothgrt', 'gothitt',
      'timesr', 'timesrb', 'timesi', 'timesib',
      'romans', 'romanp', 'romant', 'romanc', 'romand',
      'italicc', 'italict', 'italiccs',
      'scriptc', 'scripts',
      'cyrilc_1', 'cyrillic' // Cyrillic has ASCII too
    ];

    // Check if Hershey fonts directory exists
    if (fs.existsSync(hersheyDir)) {
      const files = fs.readdirSync(hersheyDir);

      files.forEach(file => {
        if (file.endsWith('.jhf')) {
          const name = path.basename(file, '.jhf');

          // Only include English-compatible fonts
          if (englishFonts.includes(name)) {
            const fontPath = path.join(hersheyDir, file);

            fonts.push({
              name: name,
              displayName: formatFontName(name),
              path: fontPath,
              type: 'hershey'
            });
          }
        }
      });
    }

    // Add Relief SingleLine fonts from resources
    const reliefDir = path.join(__dirname, '../resources/fonts/relief');
    if (fs.existsSync(reliefDir)) {
      const reliefFiles = fs.readdirSync(reliefDir);
      reliefFiles.forEach(file => {
        if (file.endsWith('.svg')) {
          const fontPath = path.join(reliefDir, file);
          fonts.push({
            name: path.basename(file, '.svg'),
            displayName: 'Relief ' + (file.includes('Ornament') ? 'Ornament' : 'SingleLine'),
            path: fontPath,
            type: 'svg'
          });
        }
      });
    }

    // Add EMS single-line fonts
    const emsDir = path.join(__dirname, '../resources/fonts/ems');
    if (fs.existsSync(emsDir)) {
      const emsFiles = fs.readdirSync(emsDir);
      emsFiles.forEach(file => {
        if (file.endsWith('.svg')) {
          const fontPath = path.join(emsDir, file);
          const name = path.basename(file, '.svg');
          fonts.push({
            name: name,
            displayName: name.replace('EMS', 'EMS '),
            path: fontPath,
            type: 'svg'
          });
        }
      });
    }

    // Add Hershey SVG fonts
    const hersheySvgDir = path.join(__dirname, '../resources/fonts/hershey-svg');
    if (fs.existsSync(hersheySvgDir)) {
      const hersheyFiles = fs.readdirSync(hersheySvgDir);
      hersheyFiles.forEach(file => {
        if (file.endsWith('.svg')) {
          const fontPath = path.join(hersheySvgDir, file);
          const name = path.basename(file, '.svg');
          // Format: HersheyGothEnglish -> Hershey Goth English
          const displayName = name.replace(/([A-Z])/g, ' $1').trim();
          fonts.push({
            name: name,
            displayName: displayName,
            path: fontPath,
            type: 'svg'
          });
        }
      });
    }

    // Sort with best fonts first (Cursive first for handwriting, then others)
    const priority = ['cursive', 'scripts', 'ReliefSingleLineSVG-Regular', 'futural', 'romans'];
    fonts.sort((a, b) => {
      const aIndex = priority.indexOf(a.name);
      const bIndex = priority.indexOf(b.name);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return a.displayName.localeCompare(b.displayName);
    });

    return { success: true, fonts };
  } catch (error) {
    return { success: false, error: error.message, fonts: [] };
  }
});

function formatFontName(name) {
  // Special names
  const special = {
    'futural': 'Futura Light',
    'futuram': 'Futura Medium',
    'scripts': 'Script Simplex',
    'scriptc': 'Script Complex',
    'cursive': 'Cursive',
    'rowmans': 'Roman Simplex',
    'rowmant': 'Roman Triplex',
    'rowmand': 'Roman Duplex',
    'romans': 'Roman Simplex',
    'romanp': 'Roman Plain',
    'romant': 'Roman Triplex',
    'romanc': 'Roman Complex',
    'romand': 'Roman Duplex',
    'timesr': 'Times Roman',
    'timesrb': 'Times Roman Bold',
    'timesi': 'Times Italic',
    'timesib': 'Times Italic Bold',
    'gothgbt': 'Gothic German Triplex',
    'gothgrt': 'Gothic German',
    'gothitt': 'Gothic Italian Triplex',
    'italicc': 'Italic Complex',
    'italict': 'Italic Triplex',
    'italiccs': 'Italic Complex Small',
    'cyrilc_1': 'Cyrillic 1',
    'cyrillic': 'Cyrillic'
  };

  return special[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

ipcMain.handle('font:load', async (event, fontPath) => {
  try {
    const ext = path.extname(fontPath).toLowerCase();

    // Handle JHF files
    if (ext === '.jhf') {
      const content = fs.readFileSync(fontPath, 'utf-8');
      const glyphs = parseJHF(content);

      return {
        success: true,
        data: {
          name: path.basename(fontPath, '.jhf'),
          type: 'hershey',
          glyphs: glyphs,
          path: fontPath
        }
      };
    }

    // Handle SVG font files
    if (ext === '.svg') {
      const content = fs.readFileSync(fontPath, 'utf-8');
      const fontData = parseSVGFont(content);

      // Extract font name from path or content
      const fontNameMatch = content.match(/font-family="([^"]+)"/);
      const fontName = fontNameMatch ? fontNameMatch[1] : path.basename(fontPath, '.svg');

      return {
        success: true,
        data: {
          name: fontName,
          type: 'svg',
          glyphs: fontData.glyphs,
          unitsPerEm: fontData.unitsPerEm,
          ascent: fontData.ascent,
          descent: fontData.descent,
          defaultWidth: fontData.defaultWidth,
          path: fontPath
        }
      };
    }

    // Handle TTF/OTF files
    const opentype = require('opentype.js');
    const buffer = fs.readFileSync(fontPath);
    const font = opentype.parse(buffer.buffer);

    return {
      success: true,
      data: {
        name: font.names.fontFamily.en || 'Unknown',
        type: 'opentype',
        unitsPerEm: font.unitsPerEm,
        ascender: font.ascender,
        descender: font.descender,
        path: fontPath
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('paths:generate', async (event, { text, fontPath, fontSize, fontData, pageSize, charSpacing = 1.0, strokeWidth = 2, pageRotated = false, pageMargins = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 } }) => {
  try {
    const ext = path.extname(fontPath).toLowerCase();

    // Parse page size (e.g., "4x6" -> {width: 4, height: 6}), with rotation if needed
    const pageDimensions = pageSize ? parsePageSize(pageSize, pageRotated) : null;

    // Split text into lines for multi-line rendering
    const lines = text.split(/\r?\n/);

    // Handle Hershey JHF fonts
    if (ext === '.jhf' || fontData?.type === 'hershey') {
      const glyphs = fontData?.glyphs || parseJHF(fs.readFileSync(fontPath, 'utf-8'));
      const paths = [];
      const charWidth = fontSize * 0.7 * charSpacing; // Apply character spacing
      const lineHeight = fontSize * 1.5; // Line spacing
      let maxWidth = 0;

      lines.forEach((line, lineIndex) => {
        let x = 0;
        const y = lineIndex * lineHeight;

        for (const char of line) {
          const charCode = char.charCodeAt(0);
          const pathData = glyphs[charCode];

          if (pathData) {
            paths.push({
              character: char,
              pathData: pathData,
              x: x,
              y: y,
              line: lineIndex
            });
            x += charWidth;
          } else if (char === ' ') {
            x += fontSize * 0.4 * charSpacing;
          }
        }
        maxWidth = Math.max(maxWidth, x);
      });

      const svg = generateHersheySVG(paths, fontSize, maxWidth, pageDimensions, lines.length, lineHeight, strokeWidth, pageMargins);

      return {
        success: true,
        data: {
          text,
          paths,
          svg,
          metadata: {
            fontPath,
            fontSize,
            charCount: text.length,
            type: 'hershey',
            pageSize: pageDimensions
          }
        }
      };
    }

    // Handle SVG fonts
    if (ext === '.svg' || fontData?.type === 'svg') {
      const glyphs = fontData?.glyphs;
      const unitsPerEm = fontData?.unitsPerEm || 1000;
      const defaultWidth = fontData?.defaultWidth || 500;
      const scale = fontSize / unitsPerEm;
      const lineHeight = fontSize * 1.5; // Line spacing

      console.log(`Generating SVG font paths: ${lines.length} lines, fontSize=${fontSize}, unitsPerEm=${unitsPerEm}, scale=${scale}, charSpacing=${charSpacing}`);
      console.log(`Available glyphs:`, Object.keys(glyphs).length);

      const paths = [];
      let maxWidth = 0;

      lines.forEach((line, lineIndex) => {
        let x = 0;

        for (const char of line) {
          const charCode = char.charCodeAt(0);
          const glyph = glyphs[charCode];

          if (glyph) {
            console.log(`Char '${char}' (${charCode}): advanceWidth=${glyph.advanceWidth}, xPos=${x.toFixed(2)}, line=${lineIndex}`);
            paths.push({
              character: char,
              pathData: glyph.pathData,
              x: x,
              y: lineIndex * lineHeight,
              advanceWidth: glyph.advanceWidth * charSpacing,
              line: lineIndex
            });
            x += glyph.advanceWidth * scale * charSpacing;
          } else {
            console.log(`Char '${char}' (${charCode}): NOT FOUND`);
            if (char === ' ') {
              // Add a space with default width
              const spaceWidth = defaultWidth * charSpacing;
              paths.push({
                character: char,
                pathData: '',
                x: x,
                y: lineIndex * lineHeight,
                advanceWidth: spaceWidth,
                line: lineIndex
              });
              x += spaceWidth * scale;
            }
          }
        }
        maxWidth = Math.max(maxWidth, x);
      });

      console.log(`Total paths generated: ${paths.length}`);
      const svg = generateSVGFontSVG(paths, fontSize, scale, unitsPerEm, pageDimensions, lines.length, lineHeight, strokeWidth, pageMargins);

      return {
        success: true,
        data: {
          text,
          paths,
          svg,
          metadata: {
            fontPath,
            fontSize,
            charCount: text.length,
            type: 'svg',
            pageSize: pageDimensions
          }
        }
      };
    }

    // Handle OpenType fonts
    const opentype = require('opentype.js');
    const buffer = fs.readFileSync(fontPath);
    const font = opentype.parse(buffer.buffer);

    const paths = [];
    const lineHeight = fontSize * 1.5;
    let maxWidth = 0;

    lines.forEach((line, lineIndex) => {
      let x = 0;
      const y = fontSize + (lineIndex * lineHeight);

      for (const char of line) {
        const glyphPath = font.getPath(char, x, y, fontSize);
        const glyph = font.charToGlyph(char);

        paths.push({
          character: char,
          pathData: glyphPath.toPathData(),
          bounds: glyphPath.getBoundingBox(),
          line: lineIndex
        });

        x += (glyph.advanceWidth * fontSize * charSpacing) / font.unitsPerEm;
      }
      maxWidth = Math.max(maxWidth, x);
    });

    const svg = generateSVG(paths, fontSize, maxWidth, pageDimensions, lines.length, lineHeight, strokeWidth, pageMargins);

    return {
      success: true,
      data: {
        text,
        paths,
        svg,
        metadata: {
          fontPath,
          fontSize,
          charCount: text.length,
          type: 'opentype',
          pageSize: pageDimensions
        }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export:svg', async (event, svgData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'writetyper-output.svg',
      filters: [{ name: 'SVG Files', extensions: ['svg'] }]
    });

    if (!result.canceled) {
      const svg = typeof svgData === 'string' ? svgData : svgData.svg;
      fs.writeFileSync(result.filePath, svg, 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export:json', async (event, pathData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'writetyper-output.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, JSON.stringify(pathData, null, 2), 'utf-8');
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Font Samples Export - generates a 1-2 page document showing all fonts
ipcMain.handle('export:fontSamples', async () => {
  try {
    // Get all available fonts (reuse existing logic)
    const fonts = [];
    const hersheyDir = path.join(FONTS_DIR, 'hershey-fonts');

    // English/ASCII compatible Hershey fonts
    const englishFonts = [
      'cursive', 'futural', 'futuram', 'scripts', 'scriptc',
      'rowmans', 'rowmant', 'rowmand',
      'romans', 'romanp', 'romant', 'romanc', 'romand'
    ];

    if (fs.existsSync(hersheyDir)) {
      const files = fs.readdirSync(hersheyDir);
      files.forEach(file => {
        if (file.endsWith('.jhf')) {
          const name = path.basename(file, '.jhf');
          if (englishFonts.includes(name)) {
            fonts.push({
              name: name,
              displayName: formatFontName(name),
              path: path.join(hersheyDir, file),
              type: 'hershey'
            });
          }
        }
      });
    }

    // Relief SingleLine fonts
    const reliefDir = path.join(__dirname, '../resources/fonts/relief');
    if (fs.existsSync(reliefDir)) {
      fs.readdirSync(reliefDir).forEach(file => {
        if (file.endsWith('.svg') && !file.includes('Ornament')) {
          fonts.push({
            name: path.basename(file, '.svg'),
            displayName: 'Relief SingleLine',
            path: path.join(reliefDir, file),
            type: 'svg'
          });
        }
      });
    }

    // EMS single-line fonts (remove EMS prefix for shorter labels)
    const emsDir = path.join(__dirname, '../resources/fonts/ems');
    if (fs.existsSync(emsDir)) {
      fs.readdirSync(emsDir).forEach(file => {
        if (file.endsWith('.svg')) {
          fonts.push({
            name: path.basename(file, '.svg'),
            displayName: path.basename(file, '.svg').replace('EMS', ''),
            path: path.join(emsDir, file),
            type: 'svg'
          });
        }
      });
    }

    // Hershey SVG fonts (shorten Hershey to H-)
    const hersheySvgDir = path.join(__dirname, '../resources/fonts/hershey-svg');
    if (fs.existsSync(hersheySvgDir)) {
      fs.readdirSync(hersheySvgDir).forEach(file => {
        if (file.endsWith('.svg')) {
          const name = path.basename(file, '.svg');
          fonts.push({
            name: name,
            displayName: name.replace(/Hershey/g, 'H-'),
            path: path.join(hersheySvgDir, file),
            type: 'svg'
          });
        }
      });
    }

    // Sort alphabetically by display name
    fonts.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Generate the samples SVG
    const svg = await generateFontSamplesSVG(fonts);

    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'font-samples.svg',
      filters: [{ name: 'SVG Files', extensions: ['svg'] }]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, svg, 'utf-8');
      return { success: true, path: result.filePath, fontCount: fonts.length };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    console.error('Font samples export error:', error);
    return { success: false, error: error.message };
  }
});

// Generate font samples SVG document - single page, 3-column layout, plotter-ready
async function generateFontSamplesSVG(fonts) {
  // US Letter: 8.5 x 11 inches at 96 DPI
  const pageWidth = 8.5 * 96;  // 816px
  const pageHeight = 11 * 96;  // 1056px
  const margin = 0.25 * 96;    // 24px margins

  // Load EMS Delight for rendering labels as paths (plotter-ready)
  const labelFontPath = path.join(__dirname, '../resources/fonts/ems/EMSDelight.svg');
  const labelFontContent = fs.readFileSync(labelFontPath, 'utf-8');
  const labelFont = parseSVGFont(labelFontContent);

  // 3-column layout
  const numColumns = 3;
  const columnWidth = (pageWidth - margin * 2) / numColumns;
  const columnGap = 8;

  // Calculate rows needed per column
  const titleHeight = 20;
  const fontsPerColumn = Math.ceil(fonts.length / numColumns);
  const availableHeight = pageHeight - (margin * 2) - titleHeight;
  const rowHeight = Math.floor(availableHeight / fontsPerColumn);

  // Font sizes - make room for pangram
  const labelFontSize = 7;
  const sampleFontSize = Math.min(12, Math.floor(rowHeight * 0.45));

  // Pangram sample text
  const sampleText = 'Sphinx of black quartz, judge my vow';

  let svgContent = '';

  // Title rendered in EMS Delight
  svgContent += renderTextAsPath(labelFont, `Font Samples (${fonts.length})`, 12, margin, margin + 10);

  // Render fonts in 3 columns
  for (let i = 0; i < fonts.length; i++) {
    const font = fonts[i];
    const column = Math.floor(i / fontsPerColumn);
    const rowInColumn = i % fontsPerColumn;

    const colX = margin + (column * columnWidth) + (column > 0 ? columnGap : 0);
    const currentY = margin + titleHeight + (rowInColumn * rowHeight) + rowHeight * 0.6;

    // Render font label using EMS Delight
    const labelText = font.displayName.substring(0, 14);
    svgContent += renderTextAsPath(labelFont, labelText, labelFontSize, colX, currentY - rowHeight * 0.35);

    // Render pangram sample in the actual font
    try {
      const samplePaths = await renderFontSample(font, sampleText, sampleFontSize, colX, currentY);
      svgContent += samplePaths;
    } catch (err) {
      // Skip fonts that fail to render
    }
  }

  // Build final SVG - exactly one US Letter page
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${pageWidth} ${pageHeight}"
     width="8.5in" height="11in">
  <style>
    path { fill: none; stroke: black; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  </style>
${svgContent}</svg>`;

  return svg;
}

// Render text as SVG paths using an SVG font (for plotter output)
function renderTextAsPath(fontData, text, fontSize, startX, startY) {
  const scale = fontSize / fontData.unitsPerEm;
  let paths = '';
  let x = startX;

  for (const char of text) {
    const charCode = char.charCodeAt(0);
    const glyph = fontData.glyphs[charCode];

    if (glyph && glyph.pathData) {
      paths += `  <path d="${glyph.pathData}" transform="translate(${x}, ${startY}) scale(${scale}, ${-scale})"/>\n`;
      x += glyph.advanceWidth * scale;
    } else if (char === ' ') {
      x += fontData.defaultWidth * scale;
    }
  }

  return paths;
}

// Render a font sample and return SVG path elements
async function renderFontSample(font, text, fontSize, startX, startY) {
  const ext = path.extname(font.path).toLowerCase();
  let paths = '';
  let x = startX;

  if (ext === '.jhf' || font.type === 'hershey') {
    // Hershey font - glyphs are centered around origin with negative X on left
    const content = fs.readFileSync(font.path, 'utf-8');
    const glyphs = parseJHF(content);
    const scale = fontSize / 25;
    const charWidth = fontSize * 0.6;
    // Hershey glyphs typically span from about -8 to +8 in X, so offset by ~8 units * scale
    const xOffset = 8 * scale;

    for (const char of text) {
      const charCode = char.charCodeAt(0);
      const pathData = glyphs[charCode];

      if (pathData) {
        // Adjust X to account for negative glyph coordinates, Y for baseline
        const yOffset = startY - fontSize * 0.2;
        paths += `  <path d="${pathData}" transform="translate(${x + xOffset}, ${yOffset}) scale(${scale})"/>\n`;
        x += charWidth;
      } else if (char === ' ') {
        x += charWidth * 0.6;
      }
    }
  } else if (ext === '.svg' || font.type === 'svg') {
    // SVG font
    const content = fs.readFileSync(font.path, 'utf-8');
    const fontData = parseSVGFont(content);
    const scale = fontSize / fontData.unitsPerEm;
    // SVG fonts have Y-up coordinate system. When we flip Y, we need to translate
    // to account for the ascent (glyphs are drawn above the baseline)
    const ascent = fontData.ascent || 800;

    for (const char of text) {
      const charCode = char.charCodeAt(0);
      const glyph = fontData.glyphs[charCode];

      if (glyph && glyph.pathData) {
        // Transform: move to baseline position, then scale with Y-flip
        // The Y offset accounts for the ascent being flipped below the baseline
        paths += `  <path d="${glyph.pathData}" transform="translate(${x}, ${startY}) scale(${scale}, ${-scale})"/>\n`;
        x += glyph.advanceWidth * scale;
      } else if (char === ' ') {
        x += fontData.defaultWidth * scale;
      }
    }
  }

  return paths;
}

// Image upload handler
ipcMain.handle('image:select', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const imagePath = result.filePaths[0];
      // Read image as base64 for Tesseract.js
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase().slice(1);
      const mimeType = ext === 'jpg' ? 'jpeg' : ext;

      return {
        success: true,
        data: `data:image/${mimeType};base64,${base64}`,
        path: imagePath
      };
    }
    return { success: false, error: 'No image selected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get sample images from samples directory
ipcMain.handle('samples:list', async () => {
  try {
    const samplesDir = path.join(__dirname, '../samples');
    if (!fs.existsSync(samplesDir)) {
      return { success: true, samples: [] };
    }

    const files = fs.readdirSync(samplesDir);
    const imageFiles = files.filter(f =>
      /\.(png|jpg|jpeg|gif|bmp|webp|tiff)$/i.test(f)
    );

    const samples = imageFiles.map(f => ({
      name: f,
      path: path.join(samplesDir, f)
    }));

    return { success: true, samples };
  } catch (error) {
    return { success: false, error: error.message, samples: [] };
  }
});

// Load a specific sample image
ipcMain.handle('samples:load', async (event, samplePath) => {
  try {
    const imageBuffer = fs.readFileSync(samplePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(samplePath).toLowerCase().slice(1);
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;

    return {
      success: true,
      data: `data:image/${mimeType};base64,${base64}`,
      path: samplePath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// PNG export handler
ipcMain.handle('export:png', async (event, dataUrl) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'writetyper-output.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    });

    if (!result.canceled) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(result.filePath, Buffer.from(base64Data, 'base64'));
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// JPG export handler
ipcMain.handle('export:jpg', async (event, dataUrl) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'writetyper-output.jpg',
      filters: [{ name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }]
    });

    if (!result.canceled) {
      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(result.filePath, Buffer.from(base64Data, 'base64'));
      return { success: true, path: result.filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

function generateSVGFontSVG(paths, fontSize, scale, unitsPerEm, pageDimensions, lineCount = 1, lineHeight = 0, strokeWidth = 2, pageMargins = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }) {
  // Convert margins from inches to pixels (96 DPI)
  const marginTop = pageMargins.top * 96;
  const marginRight = pageMargins.right * 96;
  const marginBottom = pageMargins.bottom * 96;
  const marginLeft = pageMargins.left * 96;
  const padding = 20; // fallback for fit-to-content mode

  // For SVG fonts, we need to:
  // 1. Work in font coordinate space (unitsPerEm)
  // 2. Flip Y-axis (SVG fonts have Y up, regular SVG has Y down)
  // 3. Scale to desired font size
  // 4. Position each character based on advance width

  // Calculate total width in font units
  let totalWidthFontUnits = 0;
  paths.forEach(path => {
    totalWidthFontUnits += path.advanceWidth;
  });

  // Scale to screen coordinates
  const totalWidth = totalWidthFontUnits * scale;

  // SVG fonts use ascent (800) + descent (200) = 1000 units typically
  // We'll use a standard height based on the unitsPerEm
  const ascent = 800;
  const descent = 200;
  const height = (ascent + descent) * scale;

  // Use page dimensions if provided, otherwise fit to content
  let viewBoxWidth, viewBoxHeight;
  let widthInches, heightInches;
  if (pageDimensions) {
    viewBoxWidth = pageDimensions.widthPx;
    viewBoxHeight = pageDimensions.heightPx;
    widthInches = pageDimensions.width;
    heightInches = pageDimensions.height;
  } else {
    viewBoxWidth = totalWidth + (padding * 2);
    viewBoxHeight = height + (padding * 2);
    widthInches = viewBoxWidth / 96;
    heightInches = viewBoxHeight / 96;
  }

  // Use inches for width/height so Cricut/plotters interpret size correctly
  // Use margins for page mode, padding for fit-to-content mode
  const translateX = pageDimensions ? marginLeft : padding;
  const translateY = (pageDimensions ? marginTop : padding) + ascent * scale;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" width="${widthInches}in" height="${heightInches}in">
  <style>
    path { fill: none; stroke: black; stroke-width: ${strokeWidth}; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <g transform="translate(${translateX}, ${translateY}) scale(${scale}, ${-scale})">
`;

  // Position each character in font coordinate space
  paths.forEach((path) => {
    // Skip empty paths (like spaces)
    if (path.pathData && path.pathData.trim()) {
      // Y position in font coordinates (already in path.y, scaled to screen)
      const yOffset = -(path.y || 0) / scale;
      svg += `    <path d="${path.pathData}" transform="translate(${path.x / scale}, ${yOffset})" />\n`;
    }
  });

  svg += `  </g>
</svg>`;

  console.log(`SVG Font: ${widthInches}in x ${heightInches}in`);
  return svg;
}

function generateHersheySVG(paths, fontSize, totalWidth, pageDimensions, lineCount = 1, lineHeight = 0, strokeWidth = 1, pageMargins = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }) {
  // Convert margins from inches to pixels (96 DPI)
  const marginTop = pageMargins.top * 96;
  const marginRight = pageMargins.right * 96;
  const marginBottom = pageMargins.bottom * 96;
  const marginLeft = pageMargins.left * 96;
  const padding = 20; // fallback for fit-to-content mode
  const scale = fontSize / 25; // Hershey fonts are ~25 units tall

  // Calculate actual bounds of all glyphs to handle negative coordinates
  let minX = 0;
  let maxX = 0;
  let minY = -25; // Hershey fonts typically range from -25 to 0
  let maxY = 0;

  // Parse all path data to find bounds
  paths.forEach((path) => {
    const commands = path.pathData.split(/[ML]/);
    commands.forEach(cmd => {
      const coords = cmd.trim().split(' ');
      if (coords.length === 2) {
        const x = parseFloat(coords[0]);
        const y = parseFloat(coords[1]);
        if (!isNaN(x) && !isNaN(y)) {
          const scaledX = path.x + (x * scale);
          const scaledY = y * scale;
          minX = Math.min(minX, scaledX);
          maxX = Math.max(maxX, scaledX);
          minY = Math.min(minY, scaledY);
          maxY = Math.max(maxY, scaledY);
        }
      }
    });
  });

  // Use page dimensions if provided, otherwise fit to content
  let viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight;
  let widthInches, heightInches;
  if (pageDimensions) {
    viewBoxX = 0;
    viewBoxY = 0;
    viewBoxWidth = pageDimensions.widthPx;
    viewBoxHeight = pageDimensions.heightPx;
    widthInches = pageDimensions.width;
    heightInches = pageDimensions.height;
  } else {
    viewBoxX = minX - padding;
    viewBoxY = minY - padding;
    viewBoxWidth = (maxX - minX) + (padding * 2);
    viewBoxHeight = (maxY - minY) + (padding * 2);
    widthInches = viewBoxWidth / 96;
    heightInches = viewBoxHeight / 96;
  }

  // Use inches for width/height so Cricut/plotters interpret size correctly
  // Use margins for page mode, padding for fit-to-content mode
  const translateX = pageDimensions ? marginLeft : padding;
  const translateY = pageDimensions ? marginTop : padding;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" width="${widthInches}in" height="${heightInches}in">
  <style>
    path { fill: none; stroke: black; stroke-width: ${strokeWidth}; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <g transform="translate(${translateX}, ${translateY})">
`;

  paths.forEach((path) => {
    svg += `    <path d="${path.pathData}" transform="translate(${path.x}, ${path.y}) scale(${scale})" />\n`;
  });

  svg += `  </g>
</svg>`;

  console.log(`SVG: ${widthInches}in x ${heightInches}in (${viewBoxWidth}x${viewBoxHeight}px)`);
  return svg;
}

function generateSVG(paths, fontSize, totalWidth, pageDimensions, lineCount = 1, lineHeight = 0, strokeWidth = 1, pageMargins = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }) {
  // Convert margins from inches to pixels (96 DPI)
  const marginTop = pageMargins.top * 96;
  const marginRight = pageMargins.right * 96;
  const marginBottom = pageMargins.bottom * 96;
  const marginLeft = pageMargins.left * 96;
  const padding = 20; // fallback for fit-to-content mode

  // Use page dimensions if provided, otherwise fit to content
  let width, height;
  let widthInches, heightInches;
  if (pageDimensions) {
    width = pageDimensions.widthPx;
    height = pageDimensions.heightPx;
    widthInches = pageDimensions.width;
    heightInches = pageDimensions.height;
  } else {
    width = totalWidth + padding * 2;
    height = (lineCount * lineHeight || fontSize * 1.5) + padding * 2;
    widthInches = width / 96;
    heightInches = height / 96;
  }

  // Use margins for page mode, padding for fit-to-content mode
  const translateX = pageDimensions ? marginLeft : padding;
  const translateY = pageDimensions ? marginTop : padding;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${widthInches}in" height="${heightInches}in">
  <style>
    path { fill: none; stroke: black; stroke-width: ${strokeWidth}; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <g transform="translate(${translateX}, ${translateY})">
`;

  paths.forEach((pathData, i) => {
    svg += `    <path d="${pathData.pathData}" />\n`;
  });

  svg += `  </g>
</svg>`;

  return svg;
}
