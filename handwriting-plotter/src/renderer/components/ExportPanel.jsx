import React, { useState } from 'react'

export default function ExportPanel({ svgData }) {
  const [exporting, setExporting] = useState(false)

  const handleExportSVG = async () => {
    setExporting(true)
    try {
      const result = await window.api.exportSVG(svgData)
      if (result.success) {
        alert(`SVG exported to: ${result.path}`)
      }
    } catch (error) {
      alert(`Export error: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleExportCoordinates = async () => {
    setExporting(true)
    try {
      const coordData = {
        text: svgData.text,
        paths: svgData.paths,
        metadata: svgData.metadata,
        timestamp: new Date().toISOString()
      }

      const result = await window.api.exportCoordinates(coordData)
      if (result.success) {
        alert(`Coordinates exported to: ${result.path}`)
      }
    } catch (error) {
      alert(`Export error: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(svgData.svg)
    alert('SVG copied to clipboard!')
  }

  return (
    <div className="export-panel">
      <button
        onClick={handleExportSVG}
        disabled={exporting}
        className="btn btn-primary"
      >
        {exporting ? 'Exporting...' : '📥 Export SVG'}
      </button>

      <button
        onClick={handleExportCoordinates}
        disabled={exporting}
        className="btn btn-secondary"
      >
        📥 Export as JSON
      </button>

      <button
        onClick={handleCopyToClipboard}
        className="btn btn-secondary"
      >
        📋 Copy SVG
      </button>

      {svgData.metadata && (
        <div className="export-info">
          <p><strong>Font:</strong> {svgData.metadata.fontPath.split('/').pop()}</p>
          <p><strong>Type:</strong> {svgData.metadata.type === 'hershey' ? 'Hershey' : 'OpenType'}</p>
          <p><strong>Size:</strong> {svgData.metadata.fontSize}px</p>
        </div>
      )}
    </div>
  )
}
