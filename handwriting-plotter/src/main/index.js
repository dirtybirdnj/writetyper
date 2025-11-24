import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { FontProcessor } from './utils/fontProcessor.js'
import { PathOptimizer } from './utils/pathOptimizer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow
const fontProcessor = new FontProcessor()
const pathOptimizer = new PathOptimizer()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  })

  // Check if running in development (Vite dev server on port 5173)
  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Font Files', extensions: ['ttf', 'otf', 'svg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    ...options
  })
  return result.filePaths[0] || null
})

ipcMain.handle('font:load', async (event, fontPath) => {
  try {
    const fontData = await fontProcessor.loadFont(fontPath)
    return { success: true, data: fontData }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('font:loadHershey', async (event, fontName) => {
  try {
    const fontPath = path.join(__dirname, '../../resources/fonts', `${fontName}.svg`)
    const fontData = await fontProcessor.loadHersheyFont(fontPath)
    return { success: true, data: fontData }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('paths:generate', async (event, args) => {
  try {
    const { text, fontPath, fontSize, fontType } = args
    let paths
    if (fontType === 'hershey') {
      paths = await fontProcessor.generateHersheyPaths(text, fontPath, fontSize)
    } else {
      paths = await fontProcessor.generateOpenTypePaths(text, fontPath, fontSize)
    }
    return { success: true, data: paths }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('paths:optimize', async (event, svgData) => {
  try {
    const optimized = await pathOptimizer.optimize(svgData)
    return { success: true, data: optimized }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('export:svg', async (event, svgData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'output.svg',
      filters: [{ name: 'SVG Files', extensions: ['svg'] }]
    })
    if (!result.canceled) {
      await fontProcessor.writeSVG(result.filePath, svgData)
      return { success: true, path: result.filePath }
    }
    return { success: false, error: 'Export cancelled' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('export:coordinates', async (event, pathData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'output.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })
    if (!result.canceled) {
      await fontProcessor.writeJSON(result.filePath, pathData)
      return { success: true, path: result.filePath }
    }
    return { success: false, error: 'Export cancelled' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
