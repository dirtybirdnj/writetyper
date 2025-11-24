const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const os = require('os');

let mainWindow;
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

app.whenReady().then(async () => {
  await setupHersheyFonts();
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

    // Sort with best fonts first
    const priority = ['cursive', 'scripts', 'futural', 'romans'];
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

ipcMain.handle('paths:generate', async (event, { text, fontPath, fontSize, fontData }) => {
  try {
    const ext = path.extname(fontPath).toLowerCase();

    // Handle Hershey JHF fonts
    if (ext === '.jhf' || fontData?.type === 'hershey') {
      const glyphs = fontData?.glyphs || parseJHF(fs.readFileSync(fontPath, 'utf-8'));
      const paths = [];
      let x = 0;
      const charWidth = fontSize * 0.7; // Approximate Hershey char width

      for (const char of text) {
        const charCode = char.charCodeAt(0);
        const pathData = glyphs[charCode];

        if (pathData) {
          paths.push({
            character: char,
            pathData: pathData,
            x: x,
            y: 0
          });
          x += charWidth;
        } else if (char === ' ') {
          x += fontSize * 0.4;
        }
      }

      const svg = generateHersheySVG(paths, fontSize, x);

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
            type: 'hershey'
          }
        }
      };
    }

    // Handle OpenType fonts
    const opentype = require('opentype.js');
    const buffer = fs.readFileSync(fontPath);
    const font = opentype.parse(buffer.buffer);

    const paths = [];
    let x = 0;
    const y = fontSize;

    for (const char of text) {
      const glyphPath = font.getPath(char, x, y, fontSize);
      const glyph = font.charToGlyph(char);

      paths.push({
        character: char,
        pathData: glyphPath.toPathData(),
        bounds: glyphPath.getBoundingBox()
      });

      x += (glyph.advanceWidth * fontSize) / font.unitsPerEm;
    }

    const svg = generateSVG(paths, fontSize, x);

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
          type: 'opentype'
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

function generateHersheySVG(paths, fontSize, totalWidth) {
  const padding = 20;
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

  // Add padding to bounds
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const viewBoxWidth = (maxX - minX) + (padding * 2);
  const viewBoxHeight = (maxY - minY) + (padding * 2);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
  <style>
    path { fill: none; stroke: black; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <g>
`;

  paths.forEach((path) => {
    svg += `    <path d="${path.pathData}" transform="translate(${path.x}, ${path.y}) scale(${scale})" />\n`;
  });

  svg += `  </g>
</svg>`;

  console.log(`SVG viewBox: ${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
  console.log(`Bounds: minX=${minX} maxX=${maxX} minY=${minY} maxY=${maxY}`);
  console.log(`First path sample:`, paths[0]?.pathData.substring(0, 80));
  console.log(`First char position: x=${paths[0]?.x} y=${paths[0]?.y}`);
  return svg;
}

function generateSVG(paths, fontSize, totalWidth) {
  const padding = 20;
  const height = fontSize * 1.5 + padding * 2;
  const width = totalWidth + padding * 2;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    path { fill: none; stroke: black; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <g transform="translate(${padding}, ${padding})">
`;

  paths.forEach((pathData, i) => {
    svg += `    <path d="${pathData.pathData}" />\n`;
  });

  svg += `  </g>
</svg>`;

  return svg;
}
