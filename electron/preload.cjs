const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAvailableFonts: () => ipcRenderer.invoke('fonts:getAvailable'),
  loadFont: (fontPath) => ipcRenderer.invoke('font:load', fontPath),
  generatePaths: (args) => ipcRenderer.invoke('paths:generate', args),
  exportSVG: (svgData) => ipcRenderer.invoke('export:svg', svgData),
  exportJSON: (pathData) => ipcRenderer.invoke('export:json', pathData)
});
