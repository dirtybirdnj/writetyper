const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAvailableFonts: () => ipcRenderer.invoke('fonts:getAvailable'),
  loadFont: (fontPath) => ipcRenderer.invoke('font:load', fontPath),
  generatePaths: (args) => ipcRenderer.invoke('paths:generate', args),
  exportSVG: (svgData) => ipcRenderer.invoke('export:svg', svgData),
  exportJSON: (pathData) => ipcRenderer.invoke('export:json', pathData),
  selectImage: () => ipcRenderer.invoke('image:select'),
  exportPNG: (dataUrl) => ipcRenderer.invoke('export:png', dataUrl),
  exportJPG: (dataUrl) => ipcRenderer.invoke('export:jpg', dataUrl),
  getSamples: () => ipcRenderer.invoke('samples:list'),
  loadSample: (samplePath) => ipcRenderer.invoke('samples:load', samplePath),

  // Menu event listeners
  onMenuUploadImage: (callback) => ipcRenderer.on('menu:upload-image', callback),
  onMenuLoadSample: (callback) => ipcRenderer.on('menu:load-sample', (event, samplePath) => callback(samplePath)),
  onMenuGlyphTemplate: (callback) => ipcRenderer.on('menu:glyph-template', callback),
  onMenuFontMenu: (callback) => ipcRenderer.on('menu:font-menu', callback),
  onMenuExportSVG: (callback) => ipcRenderer.on('menu:export-svg', callback),
  onMenuExportPNG: (callback) => ipcRenderer.on('menu:export-png', callback),
  onMenuExportJPG: (callback) => ipcRenderer.on('menu:export-jpg', callback),
  onMenuExportFontSamples: (callback) => ipcRenderer.on('menu:export-font-samples', callback),
  exportFontSamples: () => ipcRenderer.invoke('export:fontSamples')
});
