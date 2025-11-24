import React, { useRef, useEffect, useState } from 'react'

export default function PreviewCanvas({ svgData }) {
  const containerRef = useRef(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (!containerRef.current || !svgData) return

    const parser = new DOMParser()
    const svg = parser.parseFromString(svgData.svg, 'image/svg+xml').documentElement

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(svg)
  }, [svgData])

  const handleWheel = (e) => {
    e.preventDefault()
    const newZoom = zoom * (1 - e.deltaY * 0.001)
    setZoom(Math.max(0.1, Math.min(5, newZoom)))
  }

  return (
    <div className="preview-container">
      <div className="preview-toolbar">
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="tool-btn">
            -
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="tool-btn">
            +
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="preview-canvas"
        onWheel={handleWheel}
        style={{ cursor: 'grab' }}
      />
    </div>
  )
}
