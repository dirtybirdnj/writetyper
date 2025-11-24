import React, { useState } from 'react'

const HERSHEY_FONTS = ['futural', 'futura', 'script', 'simplex', 'triplex']

export default function FontSelector({ selectedFont, fontType, onFontSelect, onFontTypeChange }) {
  const [loading, setLoading] = useState(false)

  const handleLoadHershey = async (fontName) => {
    setLoading(true)
    try {
      const result = await window.api.loadHersheyFont(fontName)
      if (result.success) onFontSelect(result.data)
    } catch (error) {
      console.error('Failed to load Hershey font:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadCustomFont = async () => {
    try {
      const fontPath = await window.api.openFontFile()
      if (fontPath) {
        const result = await window.api.loadFont(fontPath)
        if (result.success) {
          onFontSelect(result.data)
          onFontTypeChange('opentype')
        }
      }
    } catch (error) {
      console.error('Failed to load font:', error)
    }
  }

  return (
    <div className="font-selector">
      <div className="font-type-tabs">
        <button
          className={`tab ${fontType === 'hershey' ? 'active' : ''}`}
          onClick={() => onFontTypeChange('hershey')}
        >
          Hershey
        </button>
        <button
          className={`tab ${fontType === 'opentype' ? 'active' : ''}`}
          onClick={() => onFontTypeChange('opentype')}
        >
          Custom Font
        </button>
      </div>

      {fontType === 'hershey' ? (
        <div className="hershey-fonts">
          <select
            onChange={(e) => handleLoadHershey(e.target.value)}
            disabled={loading}
            className="font-select"
          >
            <option value="">Select a Hershey font...</option>
            {HERSHEY_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <p className="help-text">
            Hershey fonts are single-stroke fonts optimized for pen plotters
          </p>
        </div>
      ) : (
        <div className="custom-font">
          {selectedFont && (
            <div className="selected-font">
              <strong>{selectedFont.name}</strong>
              <small>{selectedFont.path}</small>
            </div>
          )}
          <button
            onClick={handleLoadCustomFont}
            className="btn btn-secondary"
          >
            Load TTF/OTF Font
          </button>
          <p className="help-text">
            Select TrueType or OpenType fonts from your computer
          </p>
        </div>
      )}
    </div>
  )
}
