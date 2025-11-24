import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  openFontFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  loadFont: (fontPath) => ipcRenderer.invoke('font:load', fontPath),
  loadHersheyFont: (fontName) => ipcRenderer.invoke('font:loadHershey', fontName),
  generatePaths: (args) => ipcRenderer.invoke('paths:generate', args),
  optimizePaths: (svgData) => ipcRenderer.invoke('paths:optimize', svgData),
  exportSVG: (svgData) => ipcRenderer.invoke('export:svg', svgData),
  exportCoordinates: (pathData) => ipcRenderer.invoke('export:coordinates', pathData),
  getVersion: () => process.versions.electron
})
